using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace SoftwareFactory.IntegrationTests;

/// <summary>
/// Spins up a real PostgreSQL 16 container for the test class and applies the
/// EF Core schema. Requires a running Docker engine.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("factory_test")
        .WithUsername("factory")
        .WithPassword("factory_test_pw")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var db = CreateContext();
        // Apply the generated migrations against the fresh database.
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options, publisher: null);
    }
}
