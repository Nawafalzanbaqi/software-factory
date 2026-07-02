namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// Lifecycle status of an order. Used by OrderTracking timeline. Shared across
/// verticals (shipping and food-order lifecycles reuse the same states).
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
