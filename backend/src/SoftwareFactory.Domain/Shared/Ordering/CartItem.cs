using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// A line item within a cart. Captures a price snapshot at add-time. References
/// a generic catalog item by <see cref="ItemId"/> (a Product id for e-commerce,
/// a MenuItem id for restaurant) with denormalized display fields — no FK to any
/// vertical-specific catalog table, which keeps the cart vertical-agnostic.
/// </summary>
public class CartItem : BaseEntity
{
    public Guid CartId { get; private set; }
    public Guid ItemId { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public Money UnitPrice { get; private set; } = Money.Zero("SAR");
    public int Quantity { get; private set; }

    public Money LineTotal => UnitPrice.Multiply(Quantity);

    private CartItem() { }

    public CartItem(
        Guid itemId,
        string slug,
        string nameEn,
        string nameAr,
        Money unitPrice,
        int quantity,
        string? imageUrl)
    {
        Id = Guid.NewGuid();
        ItemId = itemId;
        Slug = slug;
        NameEn = nameEn;
        NameAr = nameAr;
        UnitPrice = unitPrice;
        Quantity = quantity < 1 ? 1 : quantity;
        ImageUrl = imageUrl;
    }

    public void SetQuantity(int quantity)
    {
        Quantity = quantity < 1 ? 1 : quantity;
        Touch();
    }

    public void Increase(int by) => SetQuantity(Quantity + by);
}
