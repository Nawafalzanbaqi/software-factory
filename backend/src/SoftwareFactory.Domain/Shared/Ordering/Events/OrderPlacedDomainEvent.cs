using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Shared.Ordering.Events;

/// <summary>
/// Raised when a customer successfully places an order (checkout), regardless of
/// vertical. Handled asynchronously to trigger side effects (e.g. notifications).
/// </summary>
public sealed record OrderPlacedDomainEvent(
    Guid OrderId,
    string OrderNumber,
    decimal Total,
    string Currency,
    string CustomerEmail) : IDomainEvent
{
    public DateTimeOffset OccurredOnUtc { get; } = DateTimeOffset.UtcNow;
}
