namespace SoftwareFactory.Application.Modules.Catalog.Categories.Dtos;

/// <summary>
/// Category DTO — shape shared with the frontend types.
/// </summary>
public sealed record CategoryDto(
    Guid Id,
    string Slug,
    string NameEn,
    string NameAr,
    string? ImageUrl,
    int ProductCount);
