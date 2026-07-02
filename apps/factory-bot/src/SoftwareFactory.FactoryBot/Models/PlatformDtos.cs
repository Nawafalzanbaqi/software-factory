namespace SoftwareFactory.FactoryBot.Models;

// Thin DTOs mirroring PHASE3.md §1. These are the bot's OWN copies so it does not
// reference the Platform projects — it only talks to the Platform REST API over HTTP.

/// <summary>Mirror of the Platform ProjectDto.</summary>
public sealed record ProjectDto(
    Guid Id,
    Guid ClientId,
    string Name,
    string SiteType,
    string CurrentPhase,
    string? RepoUrl,
    string? Branch,
    string? LiveUrl,
    DateTimeOffset CreatedAt);

/// <summary>Mirror of the Platform ApprovalGateDto (gate ∈ Architecture|Security|Deploy).</summary>
public sealed record ApprovalGateDto(
    Guid Id,
    Guid ProjectId,
    string GateType,
    string? ApprovedBy,
    DateTimeOffset? ApprovedAt,
    string? Notes,
    bool IsApproved);

/// <summary>Mirror of the Platform ApiUsageRecordDto.</summary>
public sealed record ApiUsageRecordDto(
    Guid Id,
    Guid ProjectId,
    string Model,
    long Tokens,
    decimal CostUsd,
    DateTimeOffset RecordedAt);

/// <summary>Usage rollup returned inside the project detail payload.</summary>
public sealed record UsageSummaryDto(
    decimal TotalCostUsd,
    long TotalTokens);

/// <summary>Mirror of the Platform DeploymentEventDto (status: pending|success|failure).</summary>
public sealed record DeploymentEventDto(
    Guid Id,
    Guid ProjectId,
    string Status,
    string Source,
    string? Payload,
    DateTimeOffset OccurredAt);

/// <summary>
/// Mirror of the Platform ProjectDetailDto: project + gates[] + usage summary + recent deployments
/// (GET /api/projects/{id}).
/// </summary>
public sealed record ProjectDetailDto(
    ProjectDto Project,
    IReadOnlyList<ApprovalGateDto> Gates,
    UsageSummaryDto Usage,
    IReadOnlyList<DeploymentEventDto> RecentDeployments);
