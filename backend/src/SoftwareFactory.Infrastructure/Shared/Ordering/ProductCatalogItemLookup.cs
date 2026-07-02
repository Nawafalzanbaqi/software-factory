using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Shared.Ordering;

namespace SoftwareFactory.Infrastructure.Shared.Ordering;

/// <summary>
/// E-commerce implementation of <see cref="ICatalogItemLookup"/> — resolves a
/// cart item from the Product catalog. Registered only when siteType=ecommerce.
/// </summary>
public sealed class ProductCatalogItemLookup : ICatalogItemLookup
{
    private readonly IProductRepository _products;

    public ProductCatalogItemLookup(IProductRepository products) => _products = products;

    public async Task<CatalogItemSnapshot?> FindAsync(Guid itemId, CancellationToken cancellationToken = default)
    {
        var product = await _products.GetByIdAsync(itemId, cancellationToken);
        if (product is null)
        {
            return null;
        }

        var imageUrl = product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault();

        return new CatalogItemSnapshot(
            product.Id,
            product.Slug,
            product.NameEn,
            product.NameAr,
            product.Price,
            imageUrl);
    }
}
