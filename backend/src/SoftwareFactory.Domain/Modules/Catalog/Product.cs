using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Modules.Catalog;

/// <summary>
/// Product aggregate root. Bilingual copy, money-typed price, images and tags.
/// </summary>
public class Product : AggregateRoot
{
    public string Slug { get; private set; } = string.Empty;
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string DescriptionEn { get; private set; } = string.Empty;
    public string DescriptionAr { get; private set; } = string.Empty;

    public Money Price { get; private set; } = Money.Zero("SAR");
    public decimal? CompareAtPrice { get; private set; }

    public Guid CategoryId { get; private set; }
    public Category? Category { get; private set; }

    public bool InStock { get; private set; } = true;
    public int StockQuantity { get; private set; }
    public double? Rating { get; private set; }

    private readonly List<ProductImage> _images = new();
    public IReadOnlyCollection<ProductImage> Images => _images.AsReadOnly();

    private readonly List<string> _tags = new();
    public IReadOnlyCollection<string> Tags => _tags.AsReadOnly();

    private Product() { }

    public Product(
        string slug,
        string nameEn,
        string nameAr,
        string descriptionEn,
        string descriptionAr,
        Money price,
        Guid categoryId,
        int stockQuantity = 0,
        decimal? compareAtPrice = null)
    {
        Id = Guid.NewGuid();
        Slug = slug;
        NameEn = nameEn;
        NameAr = nameAr;
        DescriptionEn = descriptionEn;
        DescriptionAr = descriptionAr;
        Price = price;
        CategoryId = categoryId;
        StockQuantity = stockQuantity;
        InStock = stockQuantity > 0;
        CompareAtPrice = compareAtPrice;
    }

    public void AddImage(ProductImage image) => _images.Add(image);

    public void AddTag(string tag)
    {
        if (!string.IsNullOrWhiteSpace(tag) && !_tags.Contains(tag))
        {
            _tags.Add(tag);
        }
    }

    public void SetRating(double rating) => Rating = rating;

    public void AdjustStock(int quantity)
    {
        StockQuantity = Math.Max(0, StockQuantity + quantity);
        InStock = StockQuantity > 0;
        Touch();
    }
}
