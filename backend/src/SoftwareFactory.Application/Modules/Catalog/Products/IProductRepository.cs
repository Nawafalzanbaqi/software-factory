using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Domain.Modules.Catalog;

namespace SoftwareFactory.Application.Modules.Catalog.Products;

/// <summary>
/// Persistence abstraction for the Product aggregate. Implemented in
/// Infrastructure with EF Core (parameterized queries only).
/// </summary>
public interface IProductRepository
{
    Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>Filter/sort/page products. All parameters are optional.</summary>
    Task<PagedResult<Product>> SearchAsync(
        string? categorySlug,
        string? search,
        string? sort,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> FullTextSearchAsync(string term, int limit, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default);

    Task AddAsync(Product product, CancellationToken cancellationToken = default);
}
