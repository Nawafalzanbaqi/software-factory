using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SoftwareFactory.Application.Common.Behaviors;
using SoftwareFactory.Application.Shared.Ordering;

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

        // Shared ordering pipeline — turns a cart + fulfillment into an order.
        // Used by both the e-commerce and restaurant checkouts.
        services.AddScoped<PlaceOrderService>();

        return services;
    }
}
