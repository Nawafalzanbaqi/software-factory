namespace SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

/// <summary>
/// Product DTO — shape shared with the frontend types (see ARCHITECTURE.md §2).
/// </summary>
public sealed record ProductDto(
    Guid Id,
    string Slug,
    string NameEn,
    string NameAr,
    string DescriptionEn,
    string DescriptionAr,
    decimal Price,
    string Currency,
    decimal? CompareAtPrice,
    Guid CategoryId,
    IReadOnlyList<string> Images,
    bool InStock,
    double? Rating,
    IReadOnlyList<string> Tags);
