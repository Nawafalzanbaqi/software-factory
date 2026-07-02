using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Application.Modules.Restaurant.Menu.Dtos;

/// <summary>Menu category DTO (PHASE2.md §3).</summary>
public sealed record MenuCategoryDto(
    Guid Id,
    string Slug,
    string NameEn,
    string NameAr,
    string? ImageUrl,
    int ItemCount);

/// <summary>Menu item DTO (PHASE2.md §3).</summary>
public sealed record MenuItemDto(
    Guid Id,
    string Slug,
    string NameEn,
    string NameAr,
    string DescriptionEn,
    string DescriptionAr,
    decimal Price,
    string Currency,
    Guid CategoryId,
    IReadOnlyList<string> Images,
    bool IsAvailable,
    IReadOnlyList<string> Tags,
    int? SpicyLevel,
    int? Calories);

public static class MenuMapping
{
    public static MenuItemDto ToDto(this MenuItem item) => new(
        item.Id,
        item.Slug,
        item.NameEn,
        item.NameAr,
        item.DescriptionEn,
        item.DescriptionAr,
        item.Price.Amount,
        item.Price.Currency,
        item.CategoryId,
        item.Images.ToList(),
        item.IsAvailable,
        item.Tags.ToList(),
        item.SpicyLevel,
        item.Calories);
}
