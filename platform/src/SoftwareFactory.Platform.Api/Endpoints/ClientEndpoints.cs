using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Api.Endpoints;

public static class ClientEndpoints
{
    public static IEndpointRouteBuilder MapClientEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/clients").WithTags("Clients");

        group.MapGet("/", async (IClientService svc, CancellationToken ct)
            => Results.Ok(await svc.GetClientsAsync(ct)))
            .Produces<IReadOnlyList<ClientDto>>();

        group.MapPost("/", async (CreateClientRequest req, IClientService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateClientAsync(req, ct);
            return Results.Created($"/api/clients/{created.Id}", created);
        }).Produces<ClientDto>(StatusCodes.Status201Created);

        group.MapGet("/{id:guid}", async (Guid id, IClientService svc, CancellationToken ct) =>
        {
            var client = await svc.GetClientAsync(id, ct);
            return client is null ? Results.NotFound() : Results.Ok(client);
        }).Produces<ClientDto>();

        group.MapGet("/{id:guid}/projects", async (Guid id, IClientService svc, CancellationToken ct)
            => Results.Ok(await svc.GetClientProjectsAsync(id, ct)))
            .Produces<IReadOnlyList<ProjectDto>>();

        return app;
    }
}
