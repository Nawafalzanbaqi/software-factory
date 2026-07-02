using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Api.Endpoints;

public static class ClientEndpoints
{
    public static IEndpointRouteBuilder MapClientEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/clients").WithTags("Clients");

        group.MapGet("/", async (IClientService svc, CancellationToken ct)
            => Results.Ok(await svc.GetClientsAsync(ct)));

        group.MapPost("/", async (CreateClientRequest req, IClientService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateClientAsync(req, ct);
            return Results.Created($"/api/clients/{created.Id}", created);
        });

        group.MapGet("/{id:guid}", async (Guid id, IClientService svc, CancellationToken ct) =>
        {
            var client = await svc.GetClientAsync(id, ct);
            return client is null ? Results.NotFound() : Results.Ok(client);
        });

        group.MapGet("/{id:guid}/projects", async (Guid id, IClientService svc, CancellationToken ct)
            => Results.Ok(await svc.GetClientProjectsAsync(id, ct)));

        return app;
    }
}
