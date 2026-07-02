using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.Shared.Ordering.Events;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// Order aggregate root — shared by every vertical. Created at checkout, raises
/// <see cref="OrderPlacedDomainEvent"/> and owns its items + status timeline.
/// Fulfillment metadata is carried as optional owned value objects:
/// <see cref="ShippingAddress"/> (e-commerce) or <see cref="Fulfillment"/>
/// (restaurant) — only one is set per order.
/// </summary>
public class Order : AggregateRoot
{
    public string OrderNumber { get; private set; } = string.Empty;
    public string? UserId { get; private set; }

    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerEmail { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    public string PaymentMethod { get; private set; } = string.Empty;

    /// <summary>E-commerce shipping address (nullable owned VO).</summary>
    public ShippingAddress? ShippingAddress { get; private set; }

    /// <summary>Restaurant fulfillment (nullable owned VO).</summary>
    public Fulfillment? Fulfillment { get; private set; }

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
        string paymentMethod,
        string currency,
        ShippingAddress? shippingAddress,
        Fulfillment? fulfillment,
        string? userId)
    {
        Id = Guid.NewGuid();
        OrderNumber = orderNumber;
        CustomerName = customerName;
        CustomerEmail = customerEmail;
        CustomerPhone = customerPhone;
        PaymentMethod = paymentMethod;
        Currency = currency;
        ShippingAddress = shippingAddress;
        Fulfillment = fulfillment;
        UserId = userId;
    }

    /// <summary>
    /// Generic factory that builds an order from order lines plus optional
    /// fulfillment metadata, and raises the placed event. Called by the shared
    /// PlaceOrderService for both verticals.
    /// </summary>
    public static Order Place(
        string orderNumber,
        string customerName,
        string customerEmail,
        string customerPhone,
        string paymentMethod,
        string currency,
        IEnumerable<OrderItem> items,
        ShippingAddress? shippingAddress = null,
        Fulfillment? fulfillment = null,
        string? userId = null)
    {
        var order = new Order(
            orderNumber, customerName, customerEmail, customerPhone,
            paymentMethod, currency, shippingAddress, fulfillment, userId);

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
