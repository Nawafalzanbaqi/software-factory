using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SoftwareFactory.Application.Common.Behaviors;

namespace SoftwareFactory.Application;

/// <summary>
/// Registers the Application layer: MediatR handlers, pipeline behaviors and
/// all FluentValidation validators found in this assembly.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            // Order matters: logging -> validation -> caching -> handler.
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
            cfg.AddOpenBehavior(typeof(CachingBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);

        return services;
    }
}
