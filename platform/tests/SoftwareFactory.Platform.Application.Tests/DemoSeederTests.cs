using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Platform.Domain.Enums;
using SoftwareFactory.Platform.Infrastructure.Persistence;
using Xunit;

namespace SoftwareFactory.Platform.Application.Tests;

public class DemoSeederTests
{
    [Fact]
    public async Task Seed_creates_one_demo_client_with_one_ecommerce_intake_project()
    {
        using var h = new TestHarness();

        var seeded = await PlatformDemoSeeder.SeedAsync(h.Db, h.Clients, h.Projects);

        Assert.True(seeded);

        var client = Assert.Single(await h.Db.Clients.AsNoTracking().ToListAsync());
        Assert.Equal(PlatformDemoSeeder.DemoClientName, client.Name);

        var project = Assert.Single(await h.Db.Projects.AsNoTracking().ToListAsync());
        Assert.Equal(client.Id, project.ClientId);
        Assert.Equal(PlatformDemoSeeder.DemoProjectName, project.Name);
        Assert.Equal(PlatformDemoSeeder.DemoProjectSiteType, project.SiteType);
        Assert.Equal(ProjectPhase.Intake, project.CurrentPhase);

        // The 3 human gates come from the same code path the API uses.
        Assert.Equal(3, await h.Db.ApprovalGates.CountAsync(g => g.ProjectId == project.Id));
    }

    [Fact]
    public async Task Seed_is_idempotent_across_restarts()
    {
        using var h = new TestHarness();

        var first = await PlatformDemoSeeder.SeedAsync(h.Db, h.Clients, h.Projects);
        var second = await PlatformDemoSeeder.SeedAsync(h.Db, h.Clients, h.Projects);

        Assert.True(first);
        Assert.False(second);
        Assert.Single(await h.Db.Clients.AsNoTracking().ToListAsync());
        Assert.Single(await h.Db.Projects.AsNoTracking().ToListAsync());
    }
}
