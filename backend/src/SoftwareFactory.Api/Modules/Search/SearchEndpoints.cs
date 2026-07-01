using MediatR;
using SoftwareFactory.Application.Modules.Search.Queries;

namespace SoftwareFactory.Api.Modules.Search;

/// <summary>Search module — gated behind features.search.</summary>
public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearch(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/search", async (string q, int? limit, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new SearchProductsQuery(q ?? string.Empty, limit ?? 20), ct)))
            .WithTags("Search")
            .WithName("SearchProducts")
            .WithSummary("Full-text product search.")
            .RequireRateLimiting("public");

        return app;
    }
}
