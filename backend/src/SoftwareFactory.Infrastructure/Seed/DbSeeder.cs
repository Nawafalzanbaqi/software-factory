using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Domain.Modules.Restaurant;
using SoftwareFactory.Domain.Modules.Restaurant.ValueObjects;
using SoftwareFactory.Domain.Modules.Reviews;
using SoftwareFactory.Domain.ValueObjects;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Seed;

/// <summary>
/// Applies the schema (migrations, with an EnsureCreated fallback) and seeds
/// sample data — but only for the active vertical and its enabled modules.
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

        if (features.IsVertical("restaurant"))
        {
            await SeedRestaurantAsync(db, features, logger, cancellationToken);
        }
        else
        {
            await SeedEcommerceAsync(db, features, logger, cancellationToken);
        }
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

            if ((await db.Database.GetAppliedMigrationsAsync(cancellationToken)).Any())
            {
                return;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Migration check failed; falling back to EnsureCreated.");
        }

        await db.Database.EnsureCreatedAsync(cancellationToken);
    }

    // -----------------------------------------------------------------------
    // E-commerce seed
    // -----------------------------------------------------------------------
    private static async Task SeedEcommerceAsync(AppDbContext db, IFeatureManager features, ILogger logger, CancellationToken cancellationToken)
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

    // -----------------------------------------------------------------------
    // Restaurant seed
    // -----------------------------------------------------------------------
    private static async Task SeedRestaurantAsync(AppDbContext db, IFeatureManager features, ILogger logger, CancellationToken cancellationToken)
    {
        if (!features.IsSectionEnabled("menu"))
        {
            logger.LogInformation("Menu section disabled — skipping restaurant seed.");
            return;
        }

        if (await db.MenuCategories.AnyAsync(cancellationToken))
        {
            return; // already seeded
        }

        var starters = new MenuCategory("starters", "Starters", "المقبلات", "https://picsum.photos/seed/starters/600/400", 1);
        var mains = new MenuCategory("mains", "Main Courses", "الأطباق الرئيسية", "https://picsum.photos/seed/mains/600/400", 2);
        var desserts = new MenuCategory("desserts", "Desserts", "الحلويات", "https://picsum.photos/seed/desserts/600/400", 3);

        await db.MenuCategories.AddRangeAsync(new[] { starters, mains, desserts }, cancellationToken);

        var items = new List<MenuItem>
        {
            BuildMenuItem("hummus", "Hummus", "حمص",
                "Creamy chickpea dip with olive oil and tahini.", "غموس الحمص الكريمي بزيت الزيتون والطحينة.",
                22m, starters.Id, spicy: 0, calories: 320, tags: new[] { "vegan", "cold" }, imageSeed: "hummus"),
            BuildMenuItem("spicy-wings", "Spicy Chicken Wings", "أجنحة دجاج حارة",
                "Six charcoal-grilled wings in a house hot sauce.", "ستة أجنحة مشوية على الفحم بصلصة حارة.",
                34m, starters.Id, spicy: 3, calories: 540, tags: new[] { "chicken", "spicy" }, imageSeed: "wings"),
            BuildMenuItem("mixed-grill", "Mixed Grill", "مشاوي مشكلة",
                "Kofta, shish tawook and lamb chops with rice.", "كفتة وشيش طاووق وريش لحم مع الأرز.",
                89m, mains.Id, spicy: 1, calories: 1180, tags: new[] { "grill", "signature" }, imageSeed: "grill"),
            BuildMenuItem("margherita", "Margherita Pizza", "بيتزا مارجريتا",
                "Wood-fired pizza with basil and mozzarella.", "بيتزا بالفرن الحجري مع الريحان والموزاريلا.",
                58m, mains.Id, spicy: 0, calories: 900, tags: new[] { "vegetarian", "pizza" }, imageSeed: "pizza"),
            BuildMenuItem("kunafa", "Kunafa", "كنافة",
                "Warm cheese kunafa with sugar syrup and pistachio.", "كنافة بالجبن الساخنة مع القطر والفستق.",
                28m, desserts.Id, spicy: null, calories: 610, tags: new[] { "sweet", "hot" }, imageSeed: "kunafa")
        };

        await db.MenuItems.AddRangeAsync(items, cancellationToken);

        // Branches (with tables) — only when the branch locator is enabled.
        if (features.IsSectionEnabled("branches") || features.IsFeatureEnabled("branchLocator"))
        {
            var downtown = new Branch(
                "downtown-riyadh", "Downtown Riyadh", "وسط الرياض",
                "King Fahd Road, Al Olaya", "طريق الملك فهد، العليا", "Riyadh",
                new GeoLocation(24.7136, 46.6753), "+966 11 000 0000",
                "Sun-Thu 12:00-00:00, Fri-Sat 13:00-01:00");
            downtown.AddTable("T1", 4);
            downtown.AddTable("T2", 2);

            var jeddah = new Branch(
                "jeddah-corniche", "Jeddah Corniche", "كورنيش جدة",
                "Corniche Road, Al Shati", "طريق الكورنيش، الشاطئ", "Jeddah",
                new GeoLocation(21.5810, 39.1360), "+966 12 000 0000",
                "Daily 13:00-01:00");
            jeddah.AddTable("A1", 6);

            await db.Branches.AddRangeAsync(new[] { downtown, jeddah }, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Categories} menu categories and {Items} menu items.", 3, items.Count);

        if (features.IsFeatureEnabled("reviews"))
        {
            var first = items[0];
            await db.Reviews.AddRangeAsync(new[]
            {
                new Review(first.Id, "Layla", 5, "Delicious", "Best hummus in town."),
                new Review(first.Id, "Faisal", 4, "Very good", "Fresh and tasty.")
            }, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Seeded sample reviews (feature enabled).");
        }
    }

    private static MenuItem BuildMenuItem(
        string slug, string nameEn, string nameAr, string descEn, string descAr,
        decimal price, Guid categoryId, int? spicy, int? calories, string[] tags, string imageSeed)
    {
        var item = new MenuItem(slug, nameEn, nameAr, descEn, descAr,
            new Money(price, "SAR"), categoryId, isAvailable: true, spicyLevel: spicy, calories: calories);
        item.AddImage($"https://picsum.photos/seed/{imageSeed}/800/800");
        item.AddImage($"https://picsum.photos/seed/{imageSeed}-2/800/800");
        foreach (var tag in tags)
        {
            item.AddTag(tag);
        }

        return item;
    }
}
