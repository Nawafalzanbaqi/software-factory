using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Platform.Domain.Entities;

namespace SoftwareFactory.Platform.Infrastructure.Persistence.Configurations;

public sealed class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> b)
    {
        b.ToTable("clients");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(200);
        b.Property(x => x.ContactEmail).HasMaxLength(320);
        b.Property(x => x.Notes);
        b.Property(x => x.CreatedAt);
        b.HasMany(x => x.Projects)
            .WithOne(p => p.Client!)
            .HasForeignKey(p => p.ClientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> b)
    {
        b.ToTable("projects");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(200);
        b.Property(x => x.SiteType).IsRequired().HasMaxLength(100);
        b.Property(x => x.CurrentPhase).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.RepoUrl).HasMaxLength(500);
        b.Property(x => x.Branch).HasMaxLength(200);
        b.Property(x => x.LiveUrl).HasMaxLength(500);
        b.Property(x => x.CreatedAt);
        b.HasIndex(x => x.ClientId);
        b.HasMany(x => x.Gates)
            .WithOne(g => g.Project!)
            .HasForeignKey(g => g.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.UsageRecords)
            .WithOne(r => r.Project!)
            .HasForeignKey(r => r.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Deployments)
            .WithOne(d => d.Project!)
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ApprovalGateConfiguration : IEntityTypeConfiguration<ApprovalGate>
{
    public void Configure(EntityTypeBuilder<ApprovalGate> b)
    {
        b.ToTable("approval_gates");
        b.HasKey(x => x.Id);
        b.Property(x => x.GateType).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.ApprovedBy).HasMaxLength(200);
        b.Property(x => x.ApprovedAt);
        b.Property(x => x.Notes);
        b.Ignore(x => x.IsApproved); // derived
        b.HasIndex(x => new { x.ProjectId, x.GateType }).IsUnique();
    }
}

public sealed class ApiUsageRecordConfiguration : IEntityTypeConfiguration<ApiUsageRecord>
{
    public void Configure(EntityTypeBuilder<ApiUsageRecord> b)
    {
        b.ToTable("api_usage_records");
        b.HasKey(x => x.Id);
        b.Property(x => x.Model).IsRequired().HasMaxLength(200);
        b.Property(x => x.Tokens);
        b.Property(x => x.CostUsd).HasColumnType("numeric(18,6)");
        b.Property(x => x.RecordedAt);
        b.HasIndex(x => x.ProjectId);
    }
}

public sealed class DeploymentEventConfiguration : IEntityTypeConfiguration<DeploymentEvent>
{
    public void Configure(EntityTypeBuilder<DeploymentEvent> b)
    {
        b.ToTable("deployment_events");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.Source).HasConversion<string>().HasMaxLength(50);
        // jsonb in Postgres; the InMemory provider treats it as a plain string column.
        b.Property(x => x.Payload).HasColumnType("jsonb");
        b.Property(x => x.OccurredAt);
        b.HasIndex(x => x.ProjectId);
        b.HasIndex(x => x.OccurredAt);
    }
}
