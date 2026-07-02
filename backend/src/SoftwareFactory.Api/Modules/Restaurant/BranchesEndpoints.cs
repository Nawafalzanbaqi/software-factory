using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Branches.Queries;

namespace SoftwareFactory.Api.Modules.Restaurant;

/// <summary>
/// Restaurant branch endpoints (locator map). Registered only when
/// siteType=restaurant.
/// </summary>
public static class BranchesEndpoints
{
    public static IEndpointRouteBuilder MapBranches(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/branches").WithTags("Branches").RequireRateLimiting("public");

        group.MapGet("", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetBranchesQuery(), ct)))
            .WithName("GetBranches")
            .WithSummary("List branches with lat/lng for the map.");

        group.MapGet("/{slug}", async (string slug, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetBranchBySlugQuery(slug), ct)))
            .WithName("GetBranchBySlug")
            .WithSummary("Branch detail by slug.");

        return app;
    }
}
