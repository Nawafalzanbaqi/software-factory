using SoftwareFactory.Domain.Modules.Catalog;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

/// <summary>
/// Maps <see cref="Product"/> aggregates to <see cref="ProductDto"/>.
/// </summary>
public static class ProductMapping
{
    public static ProductDto ToDto(this Product product) => new(
        product.Id,
        product.Slug,
        product.NameEn,
        product.NameAr,
        product.DescriptionEn,
        product.DescriptionAr,
        product.Price.Amount,
        product.Price.Currency,
        product.CompareAtPrice,
        product.CategoryId,
        product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).ToList(),
        product.InStock,
        product.Rating,
        product.Tags.ToList());
}
