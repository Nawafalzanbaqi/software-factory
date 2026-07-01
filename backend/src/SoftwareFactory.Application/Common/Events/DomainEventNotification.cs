using MediatR;
using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Application.Common.Events;

/// <summary>
/// MediatR envelope for a domain event. The Domain layer stays dependency-free;
/// Infrastructure wraps each <see cref="IDomainEvent"/> in this notification
/// and publishes it after SaveChanges. Handlers implement
/// <c>INotificationHandler&lt;DomainEventNotification&lt;TEvent&gt;&gt;</c>.
/// </summary>
public sealed class DomainEventNotification<TDomainEvent> : INotification
    where TDomainEvent : IDomainEvent
{
    public TDomainEvent DomainEvent { get; }

    public DomainEventNotification(TDomainEvent domainEvent) => DomainEvent = domainEvent;
}
