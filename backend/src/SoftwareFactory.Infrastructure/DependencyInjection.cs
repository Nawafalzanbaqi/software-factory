using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Common.Integrations;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Catalog.Categories;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Modules.Contact;
using SoftwareFactory.Application.Modules.Restaurant;
using SoftwareFactory.Application.Modules.Reviews;
using SoftwareFactory.Application.Modules.Wishlist;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Infrastructure.Caching;
using SoftwareFactory.Infrastructure.Configuration;
using SoftwareFactory.Infrastructure.Integrations;
using SoftwareFactory.Infrastructure.Modules.Restaurant;
using SoftwareFactory.Infrastructure.Persistence;
using SoftwareFactory.Infrastructure.Repositories;
using SoftwareFactory.Infrastructure.Shared.Ordering;
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

        // --- Shared ordering repositories (both verticals) ---
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();

        // --- E-commerce repositories ---
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();

        // --- Restaurant repositories ---
        services.AddScoped<IMenuCategoryRepository, MenuCategoryRepository>();
        services.AddScoped<IMenuItemRepository, MenuItemRepository>();
        services.AddScoped<IBranchRepository, BranchRepository>();
        services.AddScoped<IReservationRepository, ReservationRepository>();

        // --- Contact (shared) ---
        services.AddScoped<IContactMessageRepository, ContactMessageRepository>();

        // --- Vertical-aware cart catalog lookup: the shared cart snapshots a
        // Product (ecommerce) or a MenuItem (restaurant) depending on siteType. ---
        if (string.Equals(manifest.SiteType, "restaurant", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<ICatalogItemLookup, MenuItemCatalogItemLookup>();
        }
        else
        {
            services.AddScoped<ICatalogItemLookup, ProductCatalogItemLookup>();
        }

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
    /// Probe order for the options manifest:
    ///   1. env <c>SF_OPTIONS_FILE</c> — absolute path, or a file name/relative
    ///      path resolved against the repo root (walking up from the app base +
    ///      current directory). This is the Phase 2 vertical switch.
    ///   2. explicit config path (Options:ManifestPath),
    ///   3. the Docker mount (/app/options.json),
    ///   4. walking up the directory tree probing for <c>options.json</c>
    ///      (covers content-root ../options.json in local dev).
    /// </summary>
    private static IEnumerable<string> ResolveOptionsPaths(IConfiguration configuration)
    {
        var startDirs = new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() };

        // 1. SF_OPTIONS_FILE (Phase 2 vertical selector).
        var optionsFile = Environment.GetEnvironmentVariable("SF_OPTIONS_FILE");
        if (!string.IsNullOrWhiteSpace(optionsFile))
        {
            if (Path.IsPathRooted(optionsFile))
            {
                yield return optionsFile;
            }
            else
            {
                foreach (var start in startDirs)
                {
                    var dir = new DirectoryInfo(start);
                    for (var depth = 0; depth < 7 && dir is not null; depth++, dir = dir.Parent)
                    {
                        yield return Path.Combine(dir.FullName, optionsFile);
                    }
                }
            }
        }

        // 2. explicit config path.
        var configured = configuration["Options:ManifestPath"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            yield return configured;
        }

        // 3. Docker mount.
        yield return "/app/options.json";

        // 4. probe up for options.json.
        foreach (var start in startDirs)
        {
            var dir = new DirectoryInfo(start);
            for (var depth = 0; depth < 7 && dir is not null; depth++, dir = dir.Parent)
            {
                yield return Path.Combine(dir.FullName, "options.json");
            }
        }
    }
}
