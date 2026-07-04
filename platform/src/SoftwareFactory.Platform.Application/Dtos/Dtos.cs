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

/// <summary>GET /api/projects/{id} — project + gates + usage summary + recent deployments
/// + the intake spec / generated options.json when the project was registered via intake.</summary>
public record ProjectDetailDto(
    ProjectDto Project,
    IReadOnlyList<ApprovalGateDto> Gates,
    ProjectUsageDto Usage,
    IReadOnlyList<DeploymentEventDto> RecentDeployments,
    ProjectIntakeDto? Intake = null,
    string? OptionsJson = null);

/// <summary>The intake criteria captured at registration (defaultDirection is derived from language).</summary>
public record ProjectIntakeDto(
    string ClientName,
    string ClientContact,
    string Language,
    string DefaultDirection,
    string DesignDirection,
    IReadOnlyList<string> Sections,
    IReadOnlyList<string> Payments,
    IReadOnlyList<string> Integrations,
    IReadOnlyList<string> Features,
    string? Notes);

/// <summary>One selectable section for a site type (core sections are mandatory).</summary>
public record IntakeSectionOptionDto(string Key, bool Core, int Order);

/// <summary>Per-siteType intake options; recommendedIntegrations flags e.g. ZATCA for KSA ecommerce.</summary>
public record IntakeSiteTypeDto(
    string SiteType,
    IReadOnlyList<IntakeSectionOptionDto> Sections,
    IReadOnlyList<string> RecommendedIntegrations);

/// <summary>GET /api/intake/catalog — everything the New Project form may offer.</summary>
public record IntakeCatalogDto(
    string Market,
    string Currency,
    IReadOnlyList<string> Languages,
    IReadOnlyList<string> DesignDirections,
    IReadOnlyList<string> Payments,
    IReadOnlyList<string> Integrations,
    IReadOnlyList<string> Features,
    IReadOnlyList<IntakeSiteTypeDto> SiteTypes);

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

/// <summary>
/// POST /api/projects. Two modes:
/// legacy — clientId references an existing client, no intake spec;
/// intake — the dashboard "New Project" flow sends the full intake payload and
/// the client is resolved by name (reused case-insensitively or created).
/// </summary>
public record CreateProjectRequest(
    Guid? ClientId,
    string Name,
    string SiteType,
    string? RepoUrl,
    string? Branch,
    ProjectIntakeRequest? Intake = null);

/// <summary>Intake payload — all members nullable so validation (not model binding) reports gaps.</summary>
public record ProjectIntakeRequest(
    string? ClientName,
    string? ClientContact,
    string? Language,
    string? DesignDirection,
    IReadOnlyList<string>? Sections,
    IReadOnlyList<string>? Payments = null,
    IReadOnlyList<string>? Integrations = null,
    IReadOnlyList<string>? Features = null,
    string? Notes = null);

public record UpdatePhaseRequest(ProjectPhase Phase);

public record CreateApprovalRequest(GateType GateType, string ApprovedBy, string? Notes);

public record CreateUsageRequest(string Model, long Tokens, decimal CostUsd);

public record CreateDeploymentRequest(DeploymentStatus Status, DeploymentSource Source, string? Payload);
