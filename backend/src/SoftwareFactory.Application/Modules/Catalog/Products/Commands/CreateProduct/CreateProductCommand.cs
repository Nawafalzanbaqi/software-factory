using MediatR;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Commands.CreateProduct;

/// <summary>
/// Creates a new product. Returns the new product id.
/// </summary>
public sealed record CreateProductCommand(
    string Slug,
    string NameEn,
    string NameAr,
    string DescriptionEn,
    string DescriptionAr,
    decimal Price,
    string Currency,
    Guid CategoryId,
    int StockQuantity,
    decimal? CompareAtPrice = null,
    IReadOnlyList<string>? Images = null,
    IReadOnlyList<string>? Tags = null) : IRequest<Guid>;
