using MediatR;
using SoftwareFactory.Application.Modules.Catalog.Categories.Queries.GetCategories;
using SoftwareFactory.Application.Modules.Catalog.Products.Commands.CreateProduct;
using SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProductBySlug;
using SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProducts;

namespace SoftwareFactory.Api.Modules.Catalog;

/// <summary>
/// Catalog module endpoints: categories + products (listing & detail).
/// Presentation only — every handler delegates to MediatR (ISender).
/// </summary>
public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalog(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1").WithTags("Catalog").RequireRateLimiting("public");

        group.MapGet("/categories", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetCategoriesQuery(), ct)))
            .WithName("GetCategories")
            .WithSummary("List all categories with product counts.");

        group.MapGet("/products", async (
            string? category,
            string? search,
            int? page,
            int? pageSize,
            string? sort,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(
                new GetProductsQuery(category, search, page ?? 1, pageSize ?? 20, sort), ct);
            return Results.Ok(result);
        })
            .WithName("GetProducts")
            .WithSummary("Paged, filterable, sortable product listing.");

        group.MapGet("/products/{slug}", async (string slug, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetProductBySlugQuery(slug), ct)))
            .WithName("GetProductBySlug")
            .WithSummary("Product detail by slug (cached).");

        // Admin-style create endpoint (Phase 1: open; TODO wire admin auth policy).
        group.MapPost("/products", async (CreateProductCommand command, ISender sender, CancellationToken ct) =>
        {
            var id = await sender.Send(command, ct);
            return Results.Created($"/api/v1/products/{command.Slug}", new { id });
        })
            .WithName("CreateProduct")
            .WithSummary("Create a product.");

        return app;
    }
}
