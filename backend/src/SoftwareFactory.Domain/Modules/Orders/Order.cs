using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.Modules.Orders.Events;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Modules.Orders;

/// <summary>
/// Order aggregate root. Created at checkout, raises
/// <see cref="OrderPlacedDomainEvent"/> and owns its items + status timeline.
/// </summary>
public class Order : AggregateRoot
{
    public string OrderNumber { get; private set; } = string.Empty;
    public string? UserId { get; private set; }

    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerEmail { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    public string ShippingAddress { get; private set; } = string.Empty;
    public string PaymentMethod { get; private set; } = string.Empty;

    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public string Currency { get; private set; } = "SAR";

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private readonly List<OrderStatusHistoryEntry> _timeline = new();
    public IReadOnlyCollection<OrderStatusHistoryEntry> Timeline => _timeline.AsReadOnly();

    public Money Total
    {
        get
        {
            var total = Money.Zero(Currency);
            foreach (var item in _items)
            {
                total = total.Add(item.LineTotal);
            }

            return total;
        }
    }

    private Order() { }

    private Order(
        string orderNumber,
        string customerName,
        string customerEmail,
        string customerPhone,
        string shippingAddress,
        string paymentMethod,
        string currency,
        string? userId)
    {
        Id = Guid.NewGuid();
        OrderNumber = orderNumber;
        CustomerName = customerName;
        CustomerEmail = customerEmail;
        CustomerPhone = customerPhone;
        ShippingAddress = shippingAddress;
        PaymentMethod = paymentMethod;
        Currency = currency;
        UserId = userId;
    }

    /// <summary>
    /// Factory that builds an order from cart lines and raises the placed event.
    /// </summary>
    public static Order Place(
        string orderNumber,
        string customerName,
        string customerEmail,
        string customerPhone,
        string shippingAddress,
        string paymentMethod,
        string currency,
        IEnumerable<OrderItem> items,
        string? userId = null)
    {
        var order = new Order(orderNumber, customerName, customerEmail, customerPhone, shippingAddress, paymentMethod, currency, userId);
        foreach (var item in items)
        {
            order._items.Add(item);
        }

        order.Status = OrderStatus.Pending;
        order._timeline.Add(new OrderStatusHistoryEntry(OrderStatus.Pending, DateTimeOffset.UtcNow));

        order.RaiseDomainEvent(new OrderPlacedDomainEvent(
            order.Id,
            order.OrderNumber,
            order.Total.Amount,
            order.Currency,
            order.CustomerEmail));

        return order;
    }

    public void TransitionTo(OrderStatus status)
    {
        Status = status;
        _timeline.Add(new OrderStatusHistoryEntry(status, DateTimeOffset.UtcNow));
        Touch();
    }
}
