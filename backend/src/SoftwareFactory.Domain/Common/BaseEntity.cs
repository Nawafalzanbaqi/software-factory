namespace SoftwareFactory.Domain.Common;

/// <summary>
/// Base type for all persisted entities. Provides a strongly-typed identity
/// and audit timestamps.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();

    public DateTimeOffset CreatedAtUtc { get; protected set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAtUtc { get; protected set; }

    public void Touch() => UpdatedAtUtc = DateTimeOffset.UtcNow;
}
