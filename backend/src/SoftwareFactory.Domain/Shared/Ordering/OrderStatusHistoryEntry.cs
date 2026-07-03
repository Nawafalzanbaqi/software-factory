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
        // Id is intentionally NOT assigned here (persistence generates it on
        // add): entries are APPENDED to already-tracked orders on status
        // transitions, and an append discovered with a pre-set key would be
        // treated as an existing row to update rather than a new row.
        Status = status;
        At = at;
    }
}
