using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Services;
using SoftwareFactory.Platform.Infrastructure.Persistence;
using SoftwareFactory.Platform.Infrastructure.Repositories;

namespace SoftwareFactory.Platform.Application.Tests;

/// <summary>
/// Wires the real services against real EF Core repositories backed by the InMemory provider.
/// No Docker / Postgres required — this exercises the actual use-case code paths.
/// </summary>
public sealed class TestHarness : IDisposable
{
    public PlatformDbContext Db { get; }

    public IClientService Clients { get; }
    public IProjectService Projects { get; }
    public IApprovalService Approvals { get; }
    public IUsageService Usage { get; }
    public IDeploymentService Deployments { get; }

    public TestHarness()
    {
        var options = new DbContextOptionsBuilder<PlatformDbContext>()
            .UseInMemoryDatabase($"platform-tests-{Guid.NewGuid()}")
            .EnableSensitiveDataLogging()
            .Options;

        Db = new PlatformDbContext(options);

        var clientRepo = new ClientRepository(Db);
        var projectRepo = new ProjectRepository(Db);
        var gateRepo = new ApprovalGateRepository(Db);
        var usageRepo = new ApiUsageRepository(Db);
        var deployRepo = new DeploymentEventRepository(Db);
        IUnitOfWork uow = new UnitOfWork(Db);

        Clients = new ClientService(clientRepo, projectRepo, uow);
        Projects = new ProjectService(projectRepo, clientRepo, uow);
        Approvals = new ApprovalService(projectRepo, gateRepo, uow);
        Usage = new UsageService(projectRepo, usageRepo, uow);
        Deployments = new DeploymentService(projectRepo, deployRepo, uow);
    }

    public void Dispose() => Db.Dispose();
}
