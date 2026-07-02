using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Menu.Queries;

namespace SoftwareFactory.Api.Modules.Restaurant;

/// <summary>
/// Restaurant menu endpoints — categories + items (listing &amp; detail).
/// Registered only when siteType=restaurant.
/// </summary>
public static class MenuEndpoints
{
    public static IEndpointRouteBuilder MapMenu(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/menu").WithTags("Menu").RequireRateLimiting("public");

        group.MapGet("/categories", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetMenuCategoriesQuery(), ct)))
            .WithName("GetMenuCategories")
            .WithSummary("List menu categories with item counts.");

        group.MapGet("/items", async (
            string? category,
            string? search,
            int? page,
            int? pageSize,
            string? sort,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(
                new GetMenuItemsQuery(category, search, page ?? 1, pageSize ?? 20, sort), ct);
            return Results.Ok(result);
        })
            .WithName("GetMenuItems")
            .WithSummary("Paged, filterable, sortable menu-item listing.");

        group.MapGet("/items/{slug}", async (string slug, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetMenuItemBySlugQuery(slug), ct)))
            .WithName("GetMenuItemBySlug")
            .WithSummary("Menu item detail by slug (cached).");

        return app;
    }
}
