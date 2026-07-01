using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Catalog;

/// <summary>
/// Product category. Bilingual (EN/AR) per the shared contract.
/// </summary>
public class Category : AggregateRoot
{
    public string Slug { get; private set; } = string.Empty;
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }

    private readonly List<Product> _products = new();
    public IReadOnlyCollection<Product> Products => _products.AsReadOnly();

    private Category() { }

    public Category(string slug, string nameEn, string nameAr, string? imageUrl = null)
    {
        Id = Guid.NewGuid();
        Slug = slug;
        NameEn = nameEn;
        NameAr = nameAr;
        ImageUrl = imageUrl;
    }

    public void Update(string nameEn, string nameAr, string? imageUrl)
    {
        NameEn = nameEn;
        NameAr = nameAr;
        ImageUrl = imageUrl;
        Touch();
    }
}
