using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Common.Integrations;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Cart;
using SoftwareFactory.Application.Modules.Catalog.Categories;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Modules.Contact;
using SoftwareFactory.Application.Modules.Orders;
using SoftwareFactory.Application.Modules.Reviews;
using SoftwareFactory.Application.Modules.Wishlist;
using SoftwareFactory.Infrastructure.Caching;
using SoftwareFactory.Infrastructure.Configuration;
using SoftwareFactory.Infrastructure.Integrations;
using SoftwareFactory.Infrastructure.Persistence;
using SoftwareFactory.Infrastructure.Repositories;
using StackExchange.Redis;

namespace SoftwareFactory.Infrastructure;

/// <summary>
/// Registers the Infrastructure layer: EF Core (Npgsql), repositories, Redis
/// cache, the options.json feature manager and integration stubs.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // --- options.json manifest + feature manager (singletons) ---
        var manifest = OptionsManifest.Load(ResolveOptionsPaths(configuration));
        services.AddSingleton(manifest);
        services.AddSingleton<IFeatureManager, FeatureManager>();

        // --- EF Core / PostgreSQL ---
        var postgres = configuration.GetConnectionString("Postgres")
                       ?? configuration["ConnectionStrings:Postgres"]
                       ?? "Host=localhost;Port=5432;Database=factory;Username=factory;Password=change_me_in_prod";

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(postgres, npgsql =>
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());

        // --- Repositories ---
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IContactMessageRepository, ContactMessageRepository>();

        // --- Redis cache (falls back to a null cache if unconfigured) ---
        var redisConnection = configuration.GetConnectionString("Redis")
                              ?? configuration["ConnectionStrings:Redis"];
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddSingleton<IConnectionMultiplexer>(_ =>
            {
                var config = ConfigurationOptions.Parse(redisConnection);
                config.AbortOnConnectFail = false; // resilient startup
                return ConnectionMultiplexer.Connect(config);
            });
            services.AddSingleton<ICacheService, RedisCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, NullCacheService>();
        }

        // --- Integration stubs (Phase 1 no-ops; see TODO backlog comments) ---
        services.AddScoped<IPaymentGateway, NoOpPaymentGateway>();
        services.AddScoped<INotificationService, LoggingNotificationService>();
        services.AddScoped<IEInvoiceService, NoOpEInvoiceService>();

        return services;
    }

    /// <summary>
    /// Probe order for options.json:
    ///   1. explicit config path (Options:ManifestPath),
    ///   2. the Docker mount (/app/options.json),
    ///   3. walking up the directory tree from both the app base directory and
    ///      the current working directory (covers content-root ../options.json
    ///      in local dev, where the manifest lives at the repo root).
    /// </summary>
    private static IEnumerable<string> ResolveOptionsPaths(IConfiguration configuration)
    {
        var configured = configuration["Options:ManifestPath"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            yield return configured;
        }

        yield return "/app/options.json";

        foreach (var start in new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() })
        {
            var dir = new DirectoryInfo(start);
            for (var depth = 0; depth < 7 && dir is not null; depth++, dir = dir.Parent)
            {
                yield return Path.Combine(dir.FullName, "options.json");
            }
        }
    }
}
