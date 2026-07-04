using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SoftwareFactory.Platform.Application.Abstractions;

namespace SoftwareFactory.Platform.Infrastructure.Persistence;

/// <summary>
/// Guarded startup initializer. Applies migrations (or EnsureCreated for non-relational providers)
/// unless PLATFORM_SKIP_DB_INIT=1. Seeding is intentionally minimal — this is admin tooling;
/// the only seed is the SEED_DEMO=true demo data (see PlatformDemoSeeder), off by default.
/// </summary>
public static class PlatformDbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken ct = default)
    {
        if (Environment.GetEnvironmentVariable("PLATFORM_SKIP_DB_INIT") == "1")
            return;

        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("PlatformDbInitializer");
        var db = sp.GetRequiredService<PlatformDbContext>();

        try
        {
            if (db.Database.IsRelational())
            {
                await db.Database.MigrateAsync(ct);
            }
            else
            {
                await db.Database.EnsureCreatedAsync(ct);
            }

            if (string.Equals(Environment.GetEnvironmentVariable("SEED_DEMO"), "true", StringComparison.OrdinalIgnoreCase))
            {
                var seeded = await PlatformDemoSeeder.SeedAsync(
                    db,
                    sp.GetRequiredService<IClientService>(),
                    sp.GetRequiredService<IProjectService>(),
                    ct);
                logger.LogInformation(
                    seeded
                        ? "SEED_DEMO=true: created demo client '{Client}' with project '{Project}'."
                        : "SEED_DEMO=true: demo data already present — skipped.",
                    PlatformDemoSeeder.DemoClientName,
                    PlatformDemoSeeder.DemoProjectName);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Platform database initialization failed.");
            throw;
        }
    }
}
