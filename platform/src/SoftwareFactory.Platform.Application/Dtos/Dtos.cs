using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Application.Dtos;

// ---- Response DTOs (records) ----

public record ClientDto(
    Guid Id,
    string Name,
    string? ContactEmail,
    string? Notes,
    DateTimeOffset CreatedAt);

public record ProjectDto(
    Guid Id,
    Guid ClientId,
    string Name,
    string SiteType,
    ProjectPhase CurrentPhase,
    string? RepoUrl,
    string? Branch,
    string? LiveUrl,
    DateTimeOffset CreatedAt);

public record ApprovalGateDto(
    Guid Id,
    Guid ProjectId,
    GateType GateType,
    string? ApprovedBy,
    DateTimeOffset? ApprovedAt,
    string? Notes,
    bool IsApproved);

public record ApiUsageRecordDto(
    Guid Id,
    Guid ProjectId,
    string Model,
    long Tokens,
    decimal CostUsd,
    DateTimeOffset RecordedAt);

public record DeploymentEventDto(
    Guid Id,
    Guid ProjectId,
    DeploymentStatus Status,
    DeploymentSource Source,
    string Payload,
    DateTimeOffset OccurredAt);

/// <summary>GET /api/projects/{id}/usage payload.</summary>
public record ProjectUsageDto(
    IReadOnlyList<ApiUsageRecordDto> Records,
    decimal TotalCostUsd,
    long TotalTokens);

/// <summary>GET /api/projects/{id} — project + gates + usage summary + recent deployments.</summary>
public record ProjectDetailDto(
    ProjectDto Project,
    IReadOnlyList<ApprovalGateDto> Gates,
    ProjectUsageDto Usage,
    IReadOnlyList<DeploymentEventDto> RecentDeployments);

/// <summary>GET /api/analytics/{projectId} — NoOp returns zeros + provider:"noop".</summary>
public record AnalyticsDto(
    Guid ProjectId,
    string Provider,
    long Visitors,
    long PageViews,
    double BounceRate,
    IReadOnlyList<AnalyticsTimeseriesPointDto> Timeseries);

public record AnalyticsTimeseriesPointDto(DateTimeOffset Date, long Visitors, long PageViews);

// ---- Request DTOs ----

public record CreateClientRequest(string Name, string? ContactEmail, string? Notes);

public record CreateProjectRequest(
    Guid ClientId,
    string Name,
    string SiteType,
    string? RepoUrl,
    string? Branch);

public record UpdatePhaseRequest(ProjectPhase Phase);

public record CreateApprovalRequest(GateType GateType, string ApprovedBy, string? Notes);

public record CreateUsageRequest(string Model, long Tokens, decimal CostUsd);

public record CreateDeploymentRequest(DeploymentStatus Status, DeploymentSource Source, string? Payload);
