using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Modules.Orders;

/// <summary>
/// A purchased line captured at checkout time (price snapshot).
/// </summary>
public class OrderItem : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductNameEn { get; private set; } = string.Empty;
    public string ProductNameAr { get; private set; } = string.Empty;
    public Money UnitPrice { get; private set; } = Money.Zero("SAR");
    public int Quantity { get; private set; }

    public Money LineTotal => UnitPrice.Multiply(Quantity);

    private OrderItem() { }

    public OrderItem(Guid productId, string nameEn, string nameAr, Money unitPrice, int quantity)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        ProductNameEn = nameEn;
        ProductNameAr = nameAr;
        UnitPrice = unitPrice;
        Quantity = quantity < 1 ? 1 : quantity;
    }
}
