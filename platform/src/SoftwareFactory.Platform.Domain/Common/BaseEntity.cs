namespace SoftwareFactory.Platform.Domain.Common;

/// <summary>Minimal base entity — a Guid identity. No domain events (intentionally light).</summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}
