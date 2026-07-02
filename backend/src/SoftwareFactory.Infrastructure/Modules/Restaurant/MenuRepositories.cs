using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Restaurant;
using SoftwareFactory.Domain.Modules.Restaurant;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Modules.Restaurant;

public sealed class MenuCategoryRepository : IMenuCategoryRepository
{
    private readonly AppDbContext _db;

    public MenuCategoryRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<MenuCategory>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _db.MenuCategories.OrderBy(c => c.SortOrder).ThenBy(c => c.NameEn).ToListAsync(cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, int>> GetItemCountsAsync(CancellationToken cancellationToken = default)
    {
        var counts = await _db.MenuItems
            .GroupBy(i => i.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.CategoryId, x => x.Count);
    }
}

public sealed class MenuItemRepository : IMenuItemRepository
{
    private readonly AppDbContext _db;

    public MenuItemRepository(AppDbContext db) => _db = db;

    public Task<MenuItem?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        _db.MenuItems.FirstOrDefaultAsync(i => i.Slug == slug, cancellationToken);

    public Task<MenuItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.MenuItems.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default) =>
        _db.MenuItems.AnyAsync(i => i.Slug == slug, cancellationToken);

    public async Task<PagedResult<MenuItem>> SearchAsync(
        string? categorySlug,
        string? search,
        string? sort,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        IQueryable<MenuItem> query = _db.MenuItems;

        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            query = query.Where(i => i.Category != null && i.Category.Slug == categorySlug);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i =>
                EF.Functions.ILike(i.NameEn, $"%{term}%") ||
                EF.Functions.ILike(i.NameAr, $"%{term}%") ||
                EF.Functions.ILike(i.DescriptionEn, $"%{term}%"));
        }

        query = sort switch
        {
            "price_asc" => query.OrderBy(i => i.Price.Amount),
            "price_desc" => query.OrderByDescending(i => i.Price.Amount),
            "name_asc" => query.OrderBy(i => i.NameEn),
            "name_desc" => query.OrderByDescending(i => i.NameEn),
            _ => query.OrderByDescending(i => i.CreatedAtUtc)
        };

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<MenuItem>(items, page, pageSize, total);
    }

    public async Task<IReadOnlyList<MenuItem>> FullTextSearchAsync(string term, int limit, CancellationToken cancellationToken = default)
    {
        var value = (term ?? string.Empty).Trim();
        limit = limit is < 1 or > 100 ? 20 : limit;

        return await _db.MenuItems
            .Where(i =>
                EF.Functions.ILike(i.NameEn, $"%{value}%") ||
                EF.Functions.ILike(i.NameAr, $"%{value}%") ||
                EF.Functions.ILike(i.DescriptionEn, $"%{value}%") ||
                EF.Functions.ILike(i.DescriptionAr, $"%{value}%"))
            .OrderBy(i => i.NameEn)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(MenuItem item, CancellationToken cancellationToken = default) =>
        await _db.MenuItems.AddAsync(item, cancellationToken);
}
