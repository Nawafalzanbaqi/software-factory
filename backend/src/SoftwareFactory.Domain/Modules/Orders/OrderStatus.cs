namespace SoftwareFactory.Domain.Modules.Orders;

/// <summary>
/// Lifecycle status of an order. Used by OrderTracking timeline.
/// </summary>
public enum OrderStatus
{
    Pending = 0,
    Paid = 1,
    Processing = 2,
    Shipped = 3,
    Delivered = 4,
    Cancelled = 5
}
