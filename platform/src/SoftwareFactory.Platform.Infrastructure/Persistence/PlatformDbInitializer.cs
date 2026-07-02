using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SoftwareFactory.Platform.Infrastructure.Persistence;

/// <summary>
/// Guarded startup initializer. Applies migrations (or EnsureCreated for non-relational providers)
/// unless PLATFORM_SKIP_DB_INIT=1. Seeding is intentionally minimal — this is admin tooling.
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
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Platform database initialization failed.");
            throw;
        }
    }
}
