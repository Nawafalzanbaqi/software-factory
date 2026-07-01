using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Modules.Cart;

/// <summary>
/// A line item within a cart. Captures a price snapshot at add-time.
/// </summary>
public class CartItem : BaseEntity
{
    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductSlug { get; private set; } = string.Empty;
    public string ProductNameEn { get; private set; } = string.Empty;
    public string ProductNameAr { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public Money UnitPrice { get; private set; } = Money.Zero("SAR");
    public int Quantity { get; private set; }

    public Money LineTotal => UnitPrice.Multiply(Quantity);

    private CartItem() { }

    public CartItem(
        Guid productId,
        string productSlug,
        string productNameEn,
        string productNameAr,
        Money unitPrice,
        int quantity,
        string? imageUrl)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        ProductSlug = productSlug;
        ProductNameEn = productNameEn;
        ProductNameAr = productNameAr;
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
