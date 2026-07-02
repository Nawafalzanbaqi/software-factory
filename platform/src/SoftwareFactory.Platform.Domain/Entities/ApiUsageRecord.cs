using SoftwareFactory.Platform.Domain.Common;

namespace SoftwareFactory.Platform.Domain.Entities;

/// <summary>A single metered LLM/API call cost attributed to a project.</summary>
public class ApiUsageRecord : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Model { get; set; } = string.Empty;
    public long Tokens { get; set; }
    public decimal CostUsd { get; set; }
    public DateTimeOffset RecordedAt { get; set; } = DateTimeOffset.UtcNow;

    public Project? Project { get; set; }
}
