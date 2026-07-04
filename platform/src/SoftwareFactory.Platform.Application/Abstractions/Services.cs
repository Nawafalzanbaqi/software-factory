using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Application.Abstractions;

public interface IClientService
{
    Task<ClientDto> CreateClientAsync(CreateClientRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ClientDto>> GetClientsAsync(CancellationToken ct = default);
    Task<ClientDto?> GetClientAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectDto>> GetClientProjectsAsync(Guid clientId, CancellationToken ct = default);
}

public interface IProjectService
{
    /// <summary>Creates a project seeded with the 3 unapproved gates and CurrentPhase=Intake.
    /// With an intake payload it also validates/persists the IntakeSpec and generates options.json.</summary>
    Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(CancellationToken ct = default);
    Task<ProjectDto?> GetProjectAsync(Guid id, CancellationToken ct = default);
    Task<ProjectDetailDto?> GetProjectDetailAsync(Guid id, CancellationToken ct = default);
    Task<ProjectDto?> UpdatePhaseAsync(Guid id, ProjectPhase phase, CancellationToken ct = default);

    /// <summary>The generated options.json manifest, or null when the project (or its manifest) doesn't exist.</summary>
    Task<string?> GetProjectOptionsJsonAsync(Guid id, CancellationToken ct = default);

    /// <summary>Static intake catalog: valid site types, per-siteType sections, payments, integrations, features.</summary>
    IntakeCatalogDto GetIntakeCatalog();
}

public interface IApprovalService
{
    /// <summary>Records a human sign-off: sets ApprovedBy/ApprovedAt on the matching gate.</summary>
    Task<ApprovalGateDto> RecordApprovalAsync(Guid projectId, CreateApprovalRequest request, CancellationToken ct = default);
}

public interface IUsageService
{
    Task<ApiUsageRecordDto> RecordUsageAsync(Guid projectId, CreateUsageRequest request, CancellationToken ct = default);
    Task<ProjectUsageDto> GetUsageAsync(Guid projectId, CancellationToken ct = default);
}

public interface IDeploymentService
{
    Task<DeploymentEventDto> RecordDeploymentEventAsync(Guid projectId, CreateDeploymentRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentEventDto>> GetProjectDeploymentsAsync(Guid projectId, CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentEventDto>> GetDeploymentsSinceAsync(DateTimeOffset since, CancellationToken ct = default);
}
