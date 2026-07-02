using SoftwareFactory.Application.Modules.Restaurant;
using SoftwareFactory.Application.Shared.Ordering;

namespace SoftwareFactory.Infrastructure.Shared.Ordering;

/// <summary>
/// Restaurant implementation of <see cref="ICatalogItemLookup"/> — resolves a
/// cart item from the MenuItem catalog. Registered only when siteType=restaurant.
/// </summary>
public sealed class MenuItemCatalogItemLookup : ICatalogItemLookup
{
    private readonly IMenuItemRepository _items;

    public MenuItemCatalogItemLookup(IMenuItemRepository items) => _items = items;

    public async Task<CatalogItemSnapshot?> FindAsync(Guid itemId, CancellationToken cancellationToken = default)
    {
        var item = await _items.GetByIdAsync(itemId, cancellationToken);
        if (item is null)
        {
            return null;
        }

        var imageUrl = item.Images.FirstOrDefault();

        return new CatalogItemSnapshot(
            item.Id,
            item.Slug,
            item.NameEn,
            item.NameAr,
            item.Price,
            imageUrl);
    }
}
