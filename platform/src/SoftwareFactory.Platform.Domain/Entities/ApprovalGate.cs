using SoftwareFactory.Platform.Domain.Common;
using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Domain.Entities;

/// <summary>One of the 3 human sign-off gates for a project.</summary>
public class ApprovalGate : BaseEntity
{
    public Guid ProjectId { get; set; }
    public GateType GateType { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public string? Notes { get; set; }

    /// <summary>Derived: a gate is approved once it has an approval timestamp.</summary>
    public bool IsApproved => ApprovedAt != null;

    public Project? Project { get; set; }
}
