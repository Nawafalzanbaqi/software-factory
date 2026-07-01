namespace SoftwareFactory.Domain.Common;

/// <summary>
/// Aggregate root: an entity that records domain events. Events are collected
/// during a unit of work and dispatched after a successful SaveChanges.
/// </summary>
public abstract class AggregateRoot : BaseEntity
{
    private readonly List<IDomainEvent> _domainEvents = new();

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void RaiseDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
