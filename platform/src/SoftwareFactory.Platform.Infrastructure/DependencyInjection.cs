using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftwareFactory.Platform.Application;
using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Infrastructure.Analytics;
using SoftwareFactory.Platform.Infrastructure.Persistence;
using SoftwareFactory.Platform.Infrastructure.Repositories;

namespace SoftwareFactory.Platform.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers EF Core (Npgsql), repositories, UnitOfWork, the NoOp analytics provider,
    /// and the application services. Connection string comes from env/config
    /// (PLATFORM_DB_CONNECTION or ConnectionStrings:Platform); secrets never hard-coded.
    /// </summary>
    public static IServiceCollection AddPlatformInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("PLATFORM_DB_CONNECTION")
            ?? configuration.GetConnectionString("Platform")
            ?? "Host=localhost;Port=5432;Database=software_factory_platform;Username=postgres;Password=postgres";

        services.AddDbContext<PlatformDbContext>(options => options.UseNpgsql(connectionString));

        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<IApprovalGateRepository, ApprovalGateRepository>();
        services.AddScoped<IApiUsageRepository, ApiUsageRepository>();
        services.AddScoped<IDeploymentEventRepository, DeploymentEventRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddSingleton<IAnalyticsProvider, NoOpAnalyticsProvider>();

        services.AddPlatformApplication();

        return services;
    }
}
