using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// A single point on an order's tracking timeline.
/// </summary>
public class OrderStatusHistoryEntry : BaseEntity
{
    public Guid OrderId { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTimeOffset At { get; private set; }

    private OrderStatusHistoryEntry() { }

    public OrderStatusHistoryEntry(OrderStatus status, DateTimeOffset at)
    {
        Id = Guid.NewGuid();
        Status = status;
        At = at;
    }
}
