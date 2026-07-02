using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Platform.Domain.Entities;

namespace SoftwareFactory.Platform.Infrastructure.Persistence;

public class PlatformDbContext : DbContext
{
    public PlatformDbContext(DbContextOptions<PlatformDbContext> options) : base(options) { }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ApprovalGate> ApprovalGates => Set<ApprovalGate>();
    public DbSet<ApiUsageRecord> ApiUsageRecords => Set<ApiUsageRecord>();
    public DbSet<DeploymentEvent> DeploymentEvents => Set<DeploymentEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PlatformDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
