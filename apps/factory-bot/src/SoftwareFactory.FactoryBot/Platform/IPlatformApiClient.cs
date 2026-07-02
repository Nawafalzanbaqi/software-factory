using SoftwareFactory.FactoryBot.Models;

namespace SoftwareFactory.FactoryBot.Platform;

/// <summary>
/// Typed client over the Platform REST API (PHASE3.md §1). The bot holds NO business logic;
/// every operation is an HTTP call to the platform.
/// </summary>
public interface IPlatformApiClient
{
    /// <summary>GET /api/projects</summary>
    Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(CancellationToken cancellationToken = default);

    /// <summary>GET /api/projects/{id} — project + gates + usage + recent deployments.</summary>
    Task<ProjectDetailDto?> GetProjectAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>POST /api/projects/{id}/approvals { gateType, approvedBy, notes? }</summary>
    Task<ApprovalGateDto> ApproveGateAsync(
        Guid projectId,
        string gateType,
        string approvedBy,
        string? notes = null,
        CancellationToken cancellationToken = default);

    /// <summary>GET /api/deployments?since=&lt;iso&gt; — the outbox feed the notifier polls.</summary>
    Task<IReadOnlyList<DeploymentEventDto>> GetDeploymentsSinceAsync(
        DateTimeOffset since,
        CancellationToken cancellationToken = default);
}
