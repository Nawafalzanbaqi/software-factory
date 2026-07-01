using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Domain.Modules.Reviews;
using SoftwareFactory.Domain.ValueObjects;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Seed;

/// <summary>
/// Applies the schema (migrations, with an EnsureCreated fallback) and seeds
/// sample data — but only for modules that are enabled in options.json.
/// </summary>
public static class DbSeeder
{
    public static async Task MigrateAndSeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var features = scope.ServiceProvider.GetRequiredService<IFeatureManager>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await EnsureSchemaAsync(db, logger, cancellationToken);
        await SeedAsync(db, features, logger, cancellationToken);
    }

    private static async Task EnsureSchemaAsync(AppDbContext db, ILogger logger, CancellationToken cancellationToken)
    {
        try
        {
            var pending = await db.Database.GetPendingMigrationsAsync(cancellationToken);
            if (pending.Any())
            {
                logger.LogInformation("Applying {Count} EF migration(s).", pending.Count());
                await db.Database.MigrateAsync(cancellationToken);
                return;
            }

            // If the model has migrations but they are already applied, Migrate is a no-op.
            if ((await db.Database.GetAppliedMigrationsAsync(cancellationToken)).Any())
            {
                return;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Migration check failed; falling back to EnsureCreated.");
        }

        // Fallback: no migrations present -> create the schema from the model.
        await db.Database.EnsureCreatedAsync(cancellationToken);
    }

    private static async Task SeedAsync(AppDbContext db, IFeatureManager features, ILogger logger, CancellationToken cancellationToken)
    {
        var seedCatalog = features.IsSectionEnabled("productListing") || features.IsSectionEnabled("categories");
        if (!seedCatalog)
        {
            logger.LogInformation("Catalog sections disabled — skipping catalog seed.");
            return;
        }

        if (await db.Categories.AnyAsync(cancellationToken))
        {
            return; // already seeded
        }

        var electronics = new Category("electronics", "Electronics", "إلكترونيات", "https://picsum.photos/seed/electronics/600/400");
        var apparel = new Category("apparel", "Apparel", "ملابس", "https://picsum.photos/seed/apparel/600/400");
        var home = new Category("home-living", "Home & Living", "المنزل والمعيشة", "https://picsum.photos/seed/home/600/400");

        await db.Categories.AddRangeAsync(new[] { electronics, apparel, home }, cancellationToken);

        var products = new List<Product>
        {
            BuildProduct("wireless-headphones", "Wireless Headphones", "سماعات لاسلكية",
                "Premium noise-cancelling wireless headphones.", "سماعات لاسلكية فاخرة بخاصية عزل الضوضاء.",
                499m, electronics.Id, 25, 4.6, compareAt: 649m,
                tags: new[] { "audio", "wireless", "premium" }, imageSeed: "headphones"),
            BuildProduct("smart-watch", "Smart Watch", "ساعة ذكية",
                "Fitness-focused smart watch with AMOLED display.", "ساعة ذكية للياقة البدنية بشاشة AMOLED.",
                799m, electronics.Id, 40, 4.4,
                tags: new[] { "wearable", "fitness" }, imageSeed: "watch"),
            BuildProduct("cotton-tshirt", "Cotton T-Shirt", "قميص قطني",
                "Soft premium cotton t-shirt.", "قميص قطني فاخر وناعم.",
                89m, apparel.Id, 120, 4.2,
                tags: new[] { "cotton", "casual" }, imageSeed: "tshirt"),
            BuildProduct("ceramic-mug", "Ceramic Mug", "كوب سيراميك",
                "Handcrafted ceramic mug, 350ml.", "كوب سيراميك مصنوع يدويًا سعة 350 مل.",
                45m, home.Id, 200, 4.8,
                tags: new[] { "kitchen", "handmade" }, imageSeed: "mug")
        };

        await db.Products.AddRangeAsync(products, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Categories} categories and {Products} products.", 3, products.Count);

        // Reviews are OFF by default (features.reviews) — only seed when enabled.
        if (features.IsFeatureEnabled("reviews"))
        {
            var first = products[0];
            await db.Reviews.AddRangeAsync(new[]
            {
                new Review(first.Id, "Sara", 5, "Excellent", "Sound quality is amazing."),
                new Review(first.Id, "Omar", 4, "Great value", "Comfortable and reliable.")
            }, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Seeded sample reviews (feature enabled).");
        }
    }

    private static Product BuildProduct(
        string slug, string nameEn, string nameAr, string descEn, string descAr,
        decimal price, Guid categoryId, int stock, double rating,
        string[] tags, string imageSeed, decimal? compareAt = null)
    {
        var product = new Product(slug, nameEn, nameAr, descEn, descAr,
            new Money(price, "SAR"), categoryId, stock, compareAt);
        product.SetRating(rating);
        product.AddImage(new ProductImage($"https://picsum.photos/seed/{imageSeed}/800/800", nameEn, 0));
        product.AddImage(new ProductImage($"https://picsum.photos/seed/{imageSeed}-2/800/800", nameEn, 1));
        foreach (var tag in tags)
        {
            product.AddTag(tag);
        }

        return product;
    }
}
