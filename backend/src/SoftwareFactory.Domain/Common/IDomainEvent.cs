namespace SoftwareFactory.Domain.Common;

/// <summary>
/// Marker for domain events. Kept dependency-free in the Domain layer.
/// Infrastructure wraps these in a MediatR notification when dispatching
/// (see Application.Common.Events.DomainEventNotification).
/// </summary>
public interface IDomainEvent
{
    DateTimeOffset OccurredOnUtc { get; }
}
