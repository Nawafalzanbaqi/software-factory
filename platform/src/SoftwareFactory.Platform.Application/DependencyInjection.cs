using Microsoft.Extensions.DependencyInjection;
using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Services;

namespace SoftwareFactory.Platform.Application;

public static class DependencyInjection
{
    /// <summary>Registers the plain application service classes behind their interfaces.</summary>
    public static IServiceCollection AddPlatformApplication(this IServiceCollection services)
    {
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IApprovalService, ApprovalService>();
        services.AddScoped<IUsageService, UsageService>();
        services.AddScoped<IDeploymentService, DeploymentService>();
        return services;
    }
}
