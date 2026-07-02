using SoftwareFactory.Platform.Domain.Common;
using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Domain.Entities;

/// <summary>A single site build tracked through the 7 factory phases.</summary>
public class Project : BaseEntity
{
    public Guid ClientId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Vertical template, e.g. "ecommerce" | "restaurant".</summary>
    public string SiteType { get; set; } = string.Empty;

    public ProjectPhase CurrentPhase { get; set; } = ProjectPhase.Intake;
    public string? RepoUrl { get; set; }
    public string? Branch { get; set; }
    public string? LiveUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Client? Client { get; set; }
    public ICollection<ApprovalGate> Gates { get; set; } = new List<ApprovalGate>();
    public ICollection<ApiUsageRecord> UsageRecords { get; set; } = new List<ApiUsageRecord>();
    public ICollection<DeploymentEvent> Deployments { get; set; } = new List<DeploymentEvent>();
}
