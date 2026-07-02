using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Reservations.Commands;
using SoftwareFactory.Application.Modules.Restaurant.Reservations.Queries;
using SoftwareFactory.Application.Shared.Ordering;

namespace SoftwareFactory.Api.Modules.Restaurant;

public sealed record CreateReservationRequest(
    Guid BranchId,
    CustomerInfo Customer,
    int PartySize,
    DateTimeOffset DateTime,
    Guid? TableId,
    string? Notes);

/// <summary>
/// Restaurant reservation endpoints. Registered only when siteType=restaurant.
/// </summary>
public static class ReservationsEndpoints
{
    public static IEndpointRouteBuilder MapReservations(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/reservations").WithTags("Reservations").RequireRateLimiting("public");

        group.MapPost("", async (CreateReservationRequest body, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new CreateReservationCommand(
                body.BranchId, body.Customer, body.PartySize, body.DateTime, body.TableId, body.Notes), ct);
            return Results.Created($"/api/v1/reservations/{result.Reference}", result);
        })
            .WithName("CreateReservation")
            .WithSummary("Create a table reservation.");

        group.MapGet("/{reference}", async (string reference, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetReservationByReferenceQuery(reference), ct)))
            .WithName("GetReservation")
            .WithSummary("Track a reservation by its reference.");

        return app;
    }
}
