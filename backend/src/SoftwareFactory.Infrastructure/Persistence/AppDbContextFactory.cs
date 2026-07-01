using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SoftwareFactory.Infrastructure.Persistence;

/// <summary>
/// Design-time factory so <c>dotnet ef migrations add ...</c> works without
/// booting the API. Reads the connection string from
/// <c>ConnectionStrings__Postgres</c> and falls back to a local default.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=factory;Username=factory;Password=change_me_in_prod";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(AppDbContextFactory).Assembly.FullName))
            .Options;

        // No IPublisher at design time — event dispatch is skipped.
        return new AppDbContext(options, publisher: null);
    }
}
