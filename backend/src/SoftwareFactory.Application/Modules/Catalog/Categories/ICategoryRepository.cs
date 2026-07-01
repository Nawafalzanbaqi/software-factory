using SoftwareFactory.Domain.Modules.Catalog;

namespace SoftwareFactory.Application.Modules.Catalog.Categories;

/// <summary>
/// Persistence abstraction for the Category aggregate.
/// </summary>
public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<int> CountProductsAsync(Guid categoryId, CancellationToken cancellationToken = default);

    /// <summary>Product counts keyed by category id (single round-trip).</summary>
    Task<IReadOnlyDictionary<Guid, int>> GetProductCountsAsync(CancellationToken cancellationToken = default);
}
