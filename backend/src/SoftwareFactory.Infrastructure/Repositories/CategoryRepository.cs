using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Modules.Catalog.Categories;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Repositories;

public sealed class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _db;

    public CategoryRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _db.Categories.OrderBy(c => c.NameEn).ToListAsync(cancellationToken);

    public Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        _db.Categories.FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);

    public Task<int> CountProductsAsync(Guid categoryId, CancellationToken cancellationToken = default) =>
        _db.Products.CountAsync(p => p.CategoryId == categoryId, cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, int>> GetProductCountsAsync(CancellationToken cancellationToken = default)
    {
        var counts = await _db.Products
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.CategoryId, x => x.Count);
    }
}
