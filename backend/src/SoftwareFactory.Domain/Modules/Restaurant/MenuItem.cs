using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Modules.Restaurant;

/// <summary>
/// A dish on the menu. Bilingual copy, money-typed price, images, tags and
/// optional spicy level / calories. The restaurant analogue of a <c>Product</c>.
/// </summary>
public class MenuItem : AggregateRoot
{
    public string Slug { get; private set; } = string.Empty;
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string DescriptionEn { get; private set; } = string.Empty;
    public string DescriptionAr { get; private set; } = string.Empty;

    public Money Price { get; private set; } = Money.Zero("SAR");

    public Guid CategoryId { get; private set; }
    public MenuCategory? Category { get; private set; }

    public bool IsAvailable { get; private set; } = true;
    public int? SpicyLevel { get; private set; }
    public int? Calories { get; private set; }

    private readonly List<string> _images = new();
    public IReadOnlyCollection<string> Images => _images.AsReadOnly();

    private readonly List<string> _tags = new();
    public IReadOnlyCollection<string> Tags => _tags.AsReadOnly();

    private MenuItem() { }

    public MenuItem(
        string slug,
        string nameEn,
        string nameAr,
        string descriptionEn,
        string descriptionAr,
        Money price,
        Guid categoryId,
        bool isAvailable = true,
        int? spicyLevel = null,
        int? calories = null)
    {
        Id = Guid.NewGuid();
        Slug = slug;
        NameEn = nameEn;
        NameAr = nameAr;
        DescriptionEn = descriptionEn;
        DescriptionAr = descriptionAr;
        Price = price;
        CategoryId = categoryId;
        IsAvailable = isAvailable;
        SpicyLevel = spicyLevel;
        Calories = calories;
    }

    public void AddImage(string url)
    {
        if (!string.IsNullOrWhiteSpace(url) && !_images.Contains(url))
        {
            _images.Add(url);
        }
    }

    public void AddTag(string tag)
    {
        if (!string.IsNullOrWhiteSpace(tag) && !_tags.Contains(tag))
        {
            _tags.Add(tag);
        }
    }

    public void SetAvailability(bool available)
    {
        IsAvailable = available;
        Touch();
    }
}
