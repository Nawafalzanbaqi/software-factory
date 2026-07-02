using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// A purchased line captured at checkout time (price snapshot). References a
/// generic catalog item by <see cref="ItemId"/> with denormalized display fields.
/// </summary>
public class OrderItem : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid ItemId { get; private set; }
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public Money UnitPrice { get; private set; } = Money.Zero("SAR");
    public int Quantity { get; private set; }

    public Money LineTotal => UnitPrice.Multiply(Quantity);

    private OrderItem() { }

    public OrderItem(
        Guid itemId,
        string nameEn,
        string nameAr,
        Money unitPrice,
        int quantity,
        string slug = "",
        string? imageUrl = null)
    {
        Id = Guid.NewGuid();
        ItemId = itemId;
        NameEn = nameEn;
        NameAr = nameAr;
        Slug = slug;
        ImageUrl = imageUrl;
        UnitPrice = unitPrice;
        Quantity = quantity < 1 ? 1 : quantity;
    }
}
