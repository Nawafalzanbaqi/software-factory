using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Restaurant;

/// <summary>
/// A section of the menu (e.g. Starters, Mains, Desserts). Bilingual (EN/AR).
/// The restaurant analogue of an e-commerce <c>Category</c>.
/// </summary>
public class MenuCategory : AggregateRoot
{
    public string Slug { get; private set; } = string.Empty;
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public int SortOrder { get; private set; }

    private readonly List<MenuItem> _items = new();
    public IReadOnlyCollection<MenuItem> Items => _items.AsReadOnly();

    private MenuCategory() { }

    public MenuCategory(string slug, string nameEn, string nameAr, string? imageUrl = null, int sortOrder = 0)
    {
        Id = Guid.NewGuid();
        Slug = slug;
        NameEn = nameEn;
        NameAr = nameAr;
        ImageUrl = imageUrl;
        SortOrder = sortOrder;
    }

    public void Update(string nameEn, string nameAr, string? imageUrl, int sortOrder)
    {
        NameEn = nameEn;
        NameAr = nameAr;
        ImageUrl = imageUrl;
        SortOrder = sortOrder;
        Touch();
    }
}
