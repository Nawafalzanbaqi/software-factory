using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Catalog;

/// <summary>
/// An image belonging to a product. Ordered by <see cref="SortOrder"/>.
/// </summary>
public class ProductImage : BaseEntity
{
    public Guid ProductId { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public string? AltText { get; private set; }
    public int SortOrder { get; private set; }

    private ProductImage() { }

    public ProductImage(string url, string? altText = null, int sortOrder = 0)
    {
        Id = Guid.NewGuid();
        Url = url;
        AltText = altText;
        SortOrder = sortOrder;
    }
}
