using SoftwareFactory.Platform.Domain.Entities;
using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Application.Abstractions;

public interface IClientRepository
{
    Task AddAsync(Client client, CancellationToken ct = default);
    Task<Client?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Client>> ListAsync(CancellationToken ct = default);
}

public interface IProjectRepository
{
    Task AddAsync(Project project, CancellationToken ct = default);
    Task<Project?> GetByIdAsync(Guid id, CancellationToken ct = default);
    /// <summary>Project with gates, usage and deployments eagerly loaded.</summary>
    Task<Project?> GetWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Project>> ListAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Project>> ListByClientAsync(Guid clientId, CancellationToken ct = default);
}

public interface IApprovalGateRepository
{
    Task AddRangeAsync(IEnumerable<ApprovalGate> gates, CancellationToken ct = default);
    Task<ApprovalGate?> GetByProjectAndTypeAsync(Guid projectId, GateType gateType, CancellationToken ct = default);
    Task<IReadOnlyList<ApprovalGate>> ListByProjectAsync(Guid projectId, CancellationToken ct = default);
}

public interface IApiUsageRepository
{
    Task AddAsync(ApiUsageRecord record, CancellationToken ct = default);
    Task<IReadOnlyList<ApiUsageRecord>> ListByProjectAsync(Guid projectId, CancellationToken ct = default);
}

public interface IDeploymentEventRepository
{
    Task AddAsync(DeploymentEvent evt, CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentEvent>> ListByProjectAsync(Guid projectId, CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentEvent>> ListSinceAsync(DateTimeOffset since, CancellationToken ct = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
