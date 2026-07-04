using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Domain.Entities;
using SoftwareFactory.Platform.Domain.Enums;
using SoftwareFactory.Platform.Infrastructure.Persistence;

namespace SoftwareFactory.Platform.Infrastructure.Repositories;

public sealed class ClientRepository : IClientRepository
{
    private readonly PlatformDbContext _db;
    public ClientRepository(PlatformDbContext db) => _db = db;

    public async Task AddAsync(Client client, CancellationToken ct = default)
        => await _db.Clients.AddAsync(client, ct);

    public async Task<Client?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Clients.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Client?> GetByNameAsync(string name, CancellationToken ct = default)
    {
        // ToLower comparison translates on Npgsql and evaluates fine on InMemory.
        var normalized = name.Trim().ToLower();
        return await _db.Clients.FirstOrDefaultAsync(c => c.Name.ToLower() == normalized, ct);
    }

    public async Task<IReadOnlyList<Client>> ListAsync(CancellationToken ct = default)
        => await _db.Clients.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct);
}

public sealed class ProjectRepository : IProjectRepository
{
    private readonly PlatformDbContext _db;
    public ProjectRepository(PlatformDbContext db) => _db = db;

    public async Task AddAsync(Project project, CancellationToken ct = default)
        => await _db.Projects.AddAsync(project, ct);

    public async Task<Project?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Project?> GetWithDetailsAsync(Guid id, CancellationToken ct = default)
        => await _db.Projects
            .Include(p => p.Gates)
            .Include(p => p.UsageRecords)
            .Include(p => p.Deployments)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Project>> ListAsync(CancellationToken ct = default)
        => await _db.Projects.AsNoTracking().OrderByDescending(p => p.CreatedAt).ToListAsync(ct);

    public async Task<IReadOnlyList<Project>> ListByClientAsync(Guid clientId, CancellationToken ct = default)
        => await _db.Projects.AsNoTracking()
            .Where(p => p.ClientId == clientId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
}

public sealed class ApprovalGateRepository : IApprovalGateRepository
{
    private readonly PlatformDbContext _db;
    public ApprovalGateRepository(PlatformDbContext db) => _db = db;

    public async Task AddRangeAsync(IEnumerable<ApprovalGate> gates, CancellationToken ct = default)
        => await _db.ApprovalGates.AddRangeAsync(gates, ct);

    public async Task<ApprovalGate?> GetByProjectAndTypeAsync(Guid projectId, GateType gateType, CancellationToken ct = default)
        => await _db.ApprovalGates.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.GateType == gateType, ct);

    public async Task<IReadOnlyList<ApprovalGate>> ListByProjectAsync(Guid projectId, CancellationToken ct = default)
        => await _db.ApprovalGates.AsNoTracking()
            .Where(g => g.ProjectId == projectId)
            .OrderBy(g => g.GateType)
            .ToListAsync(ct);
}

public sealed class ApiUsageRepository : IApiUsageRepository
{
    private readonly PlatformDbContext _db;
    public ApiUsageRepository(PlatformDbContext db) => _db = db;

    public async Task AddAsync(ApiUsageRecord record, CancellationToken ct = default)
        => await _db.ApiUsageRecords.AddAsync(record, ct);

    public async Task<IReadOnlyList<ApiUsageRecord>> ListByProjectAsync(Guid projectId, CancellationToken ct = default)
        => await _db.ApiUsageRecords.AsNoTracking()
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.RecordedAt)
            .ToListAsync(ct);
}

public sealed class DeploymentEventRepository : IDeploymentEventRepository
{
    private readonly PlatformDbContext _db;
    public DeploymentEventRepository(PlatformDbContext db) => _db = db;

    public async Task AddAsync(DeploymentEvent evt, CancellationToken ct = default)
        => await _db.DeploymentEvents.AddAsync(evt, ct);

    public async Task<IReadOnlyList<DeploymentEvent>> ListByProjectAsync(Guid projectId, CancellationToken ct = default)
        => await _db.DeploymentEvents.AsNoTracking()
            .Where(d => d.ProjectId == projectId)
            .OrderByDescending(d => d.OccurredAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DeploymentEvent>> ListSinceAsync(DateTimeOffset since, CancellationToken ct = default)
        => await _db.DeploymentEvents.AsNoTracking()
            .Where(d => d.OccurredAt > since)
            .OrderBy(d => d.OccurredAt)
            .ToListAsync(ct);
}

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly PlatformDbContext _db;
    public UnitOfWork(PlatformDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
