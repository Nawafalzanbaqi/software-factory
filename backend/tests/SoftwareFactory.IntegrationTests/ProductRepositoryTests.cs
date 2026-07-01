using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Domain.ValueObjects;
using SoftwareFactory.Infrastructure.Repositories;
using Xunit;

namespace SoftwareFactory.IntegrationTests;

/// <summary>
/// Exercises <see cref="ProductRepository"/> against a real Postgres instance
/// through <c>AppDbContext</c> (Testcontainers). Requires Docker.
/// </summary>
[Collection("postgres")]
public class ProductRepositoryTests : IClassFixture<PostgresFixture>
{
    private readonly PostgresFixture _fixture;

    public ProductRepositoryTests(PostgresFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Add_then_GetBySlug_roundtrips_product_with_owned_money_and_tags()
    {
        await using var db = _fixture.CreateContext();

        var category = new Category("cat-slug", "Cat EN", "Cat AR");
        db.Categories.Add(category);

        var product = new Product("int-test-product", "Name EN", "الاسم", "Desc EN", "الوصف",
            new Money(199.99m, "SAR"), category.Id, stockQuantity: 7, compareAtPrice: 249.99m);
        product.AddTag("integration");
        product.AddTag("test");
        product.AddImage(new ProductImage("https://img/1.jpg", "alt", 0));
        db.Products.Add(product);

        await db.SaveChangesAsync();

        var repo = new ProductRepository(db);
        var loaded = await repo.GetBySlugAsync("int-test-product");

        Assert.NotNull(loaded);
        Assert.Equal("Name EN", loaded!.NameEn);
        Assert.Equal(199.99m, loaded.Price.Amount);
        Assert.Equal("SAR", loaded.Price.Currency);
        Assert.Equal(249.99m, loaded.CompareAtPrice);
        Assert.Contains("integration", loaded.Tags);
        Assert.Single(loaded.Images);
        Assert.True(loaded.InStock);
    }

    [Fact]
    public async Task SearchAsync_filters_by_search_term_and_pages()
    {
        await using var db = _fixture.CreateContext();

        var category = new Category($"search-cat-{Guid.NewGuid():N}", "Cat EN", "Cat AR");
        db.Categories.Add(category);

        for (var i = 0; i < 3; i++)
        {
            db.Products.Add(new Product($"search-widget-{i}-{Guid.NewGuid():N}",
                $"SearchWidget {i}", "اسم", "Findable description", "وصف",
                new Money(10m + i, "SAR"), category.Id, stockQuantity: 1));
        }

        await db.SaveChangesAsync();

        var repo = new ProductRepository(db);
        var page = await repo.SearchAsync(categorySlug: null, search: "SearchWidget", sort: "price_asc", page: 1, pageSize: 2);

        Assert.Equal(2, page.Items.Count);
        Assert.True(page.TotalCount >= 3);
        Assert.True(page.Items[0].Price.Amount <= page.Items[1].Price.Amount);
    }
}
