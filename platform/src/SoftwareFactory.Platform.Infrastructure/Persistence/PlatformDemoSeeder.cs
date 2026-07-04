using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Infrastructure.Persistence;

/// <summary>
/// Local-development demo data, gated behind SEED_DEMO=true (off by default).
/// Seeds exactly one demo client with one ecommerce project in Intake so the
/// factory dashboard has something to show on a fresh stack. Idempotent: the
/// demo client's name is the marker — if it exists, nothing is written.
/// </summary>
public static class PlatformDemoSeeder
{
    public const string DemoClientName = "Demo Client";
    public const string DemoClientEmail = "demo@softwarefactory.local";
    public const string DemoProjectName = "Demo Storefront";
    public const string DemoProjectSiteType = "ecommerce";

    /// <summary>Returns true if demo data was created, false if it already existed.</summary>
    public static async Task<bool> SeedAsync(
        PlatformDbContext db,
        IClientService clients,
        IProjectService projects,
        CancellationToken ct = default)
    {
        if (await db.Clients.AsNoTracking().AnyAsync(c => c.Name == DemoClientName, ct))
            return false;

        var client = await clients.CreateClientAsync(
            new CreateClientRequest(
                DemoClientName,
                DemoClientEmail,
                "Seeded by SEED_DEMO=true. Safe to delete, but it reappears on the next start unless the flag is turned off."),
            ct);

        // CreateProjectAsync starts the project in Intake and seeds the 3 human gates.
        await projects.CreateProjectAsync(
            new CreateProjectRequest(client.Id, DemoProjectName, DemoProjectSiteType, RepoUrl: null, Branch: null),
            ct);

        return true;
    }
}
