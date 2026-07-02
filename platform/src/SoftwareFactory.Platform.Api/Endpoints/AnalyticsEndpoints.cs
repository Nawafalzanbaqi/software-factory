using SoftwareFactory.Platform.Application.Abstractions;

namespace SoftwareFactory.Platform.Api.Endpoints;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        // NoOp in Phase 3 — returns zeros + provider:"noop". TODO(phase-4): real Umami.
        app.MapGet("/api/analytics/{projectId:guid}", async (Guid projectId, IAnalyticsProvider analytics, CancellationToken ct)
            => Results.Ok(await analytics.GetAnalyticsAsync(projectId, ct)))
            .WithTags("Analytics");

        return app;
    }
}
