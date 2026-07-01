using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IProductRepository"/>.
/// All queries are LINQ (parameterized) — no raw SQL concatenation.
/// </summary>
public sealed class ProductRepository : IProductRepository
{
    private readonly AppDbContext _db;

    public ProductRepository(AppDbContext db) => _db = db;

    public Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        _db.Products
            .Include(p => p.Images)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);

    public Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Products
            .Include(p => p.Images)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default) =>
        _db.Products.AnyAsync(p => p.Slug == slug, cancellationToken);

    public async Task<PagedResult<Product>> SearchAsync(
        string? categorySlug,
        string? search,
        string? sort,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        IQueryable<Product> query = _db.Products.Include(p => p.Images);

        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            query = query.Where(p => p.Category != null && p.Category.Slug == categorySlug);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p =>
                EF.Functions.ILike(p.NameEn, $"%{term}%") ||
                EF.Functions.ILike(p.NameAr, $"%{term}%") ||
                EF.Functions.ILike(p.DescriptionEn, $"%{term}%"));
        }

        query = sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price.Amount),
            "price_desc" => query.OrderByDescending(p => p.Price.Amount),
            "rating" => query.OrderByDescending(p => p.Rating),
            "name_asc" => query.OrderBy(p => p.NameEn),
            "name_desc" => query.OrderByDescending(p => p.NameEn),
            _ => query.OrderByDescending(p => p.CreatedAtUtc)
        };

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new PagedResult<Product>(items, page, pageSize, total);
    }

    public async Task<IReadOnlyList<Product>> FullTextSearchAsync(string term, int limit, CancellationToken cancellationToken = default)
    {
        var value = term.Trim();
        return await _db.Products
            .Include(p => p.Images)
            .Where(p =>
                EF.Functions.ILike(p.NameEn, $"%{value}%") ||
                EF.Functions.ILike(p.NameAr, $"%{value}%") ||
                EF.Functions.ILike(p.DescriptionEn, $"%{value}%") ||
                EF.Functions.ILike(p.DescriptionAr, $"%{value}%"))
            .OrderByDescending(p => p.Rating)
            .Take(limit)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.Distinct().ToList();
        return await _db.Products
            .Include(p => p.Images)
            .Where(p => idList.Contains(p.Id))
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default) =>
        await _db.Products.AddAsync(product, cancellationToken);
}
