using SoftwareFactory.Platform.Domain.Common;
using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Domain.Entities;

/// <summary>A deployment/CI outcome recorded for a project (also the bot outbox feed).</summary>
public class DeploymentEvent : BaseEntity
{
    public Guid ProjectId { get; set; }
    public DeploymentStatus Status { get; set; }
    public DeploymentSource Source { get; set; }

    /// <summary>Raw payload (stored as jsonb in Postgres).</summary>
    public string Payload { get; set; } = "{}";
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public Project? Project { get; set; }
}
