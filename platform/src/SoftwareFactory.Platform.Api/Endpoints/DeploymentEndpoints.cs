using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Api.Endpoints;

public static class DeploymentEndpoints
{
    public static IEndpointRouteBuilder MapDeploymentEndpoints(this IEndpointRouteBuilder app)
    {
        // Outbox feed the Telegram bot polls.
        app.MapGet("/api/deployments", async (DateTimeOffset? since, IDeploymentService svc, CancellationToken ct) =>
        {
            var from = since ?? DateTimeOffset.MinValue;
            return Results.Ok(await svc.GetDeploymentsSinceAsync(from, ct));
        }).WithTags("Deployments").Produces<IReadOnlyList<DeploymentEventDto>>();

        return app;
    }
}
