using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Api.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects").WithTags("Projects");

        group.MapGet("/", async (IProjectService svc, CancellationToken ct)
            => Results.Ok(await svc.GetProjectsAsync(ct)));

        group.MapPost("/", async (CreateProjectRequest req, IProjectService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateProjectAsync(req, ct);
            return Results.Created($"/api/projects/{created.Id}", created);
        });

        group.MapGet("/{id:guid}", async (Guid id, IProjectService svc, CancellationToken ct) =>
        {
            var detail = await svc.GetProjectDetailAsync(id, ct);
            return detail is null ? Results.NotFound() : Results.Ok(detail);
        });

        group.MapPatch("/{id:guid}/phase", async (Guid id, UpdatePhaseRequest req, IProjectService svc, CancellationToken ct) =>
        {
            var updated = await svc.UpdatePhaseAsync(id, req.Phase, ct);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapPost("/{id:guid}/approvals", async (Guid id, CreateApprovalRequest req, IApprovalService svc, CancellationToken ct) =>
        {
            var gate = await svc.RecordApprovalAsync(id, req, ct);
            return Results.Ok(gate);
        });

        group.MapGet("/{id:guid}/usage", async (Guid id, IUsageService svc, CancellationToken ct)
            => Results.Ok(await svc.GetUsageAsync(id, ct)));

        group.MapPost("/{id:guid}/usage", async (Guid id, CreateUsageRequest req, IUsageService svc, CancellationToken ct) =>
        {
            var record = await svc.RecordUsageAsync(id, req, ct);
            return Results.Created($"/api/projects/{id}/usage", record);
        });

        group.MapGet("/{id:guid}/deployments", async (Guid id, IDeploymentService svc, CancellationToken ct)
            => Results.Ok(await svc.GetProjectDeploymentsAsync(id, ct)));

        group.MapPost("/{id:guid}/deployments", async (Guid id, CreateDeploymentRequest req, IDeploymentService svc, CancellationToken ct) =>
        {
            var evt = await svc.RecordDeploymentEventAsync(id, req, ct);
            return Results.Created($"/api/projects/{id}/deployments/{evt.Id}", evt);
        });

        return app;
    }
}
