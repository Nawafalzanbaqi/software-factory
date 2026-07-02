using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Application.Shared.Ordering;

/// <summary>
/// A vertical-agnostic snapshot of a catalog item, used to populate a cart line.
/// </summary>
public sealed record CatalogItemSnapshot(
    Guid ItemId,
    string Slug,
    string NameEn,
    string NameAr,
    Money UnitPrice,
    string? ImageUrl);

/// <summary>
/// Resolves a generic catalog item (Product for e-commerce, MenuItem for
/// restaurant) by id so the shared cart can snapshot its price + display fields
/// without depending on any vertical-specific catalog. Each vertical registers
/// its own implementation (selected by <c>siteType</c>).
/// </summary>
public interface ICatalogItemLookup
{
    Task<CatalogItemSnapshot?> FindAsync(Guid itemId, CancellationToken cancellationToken = default);
}
