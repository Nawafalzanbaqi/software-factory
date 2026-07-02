using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Orders.OrderHistory;
using SoftwareFactory.Application.Shared.Ordering.Orders.OrderTracking;

namespace SoftwareFactory.Api.Shared.Ordering;

/// <summary>
/// Shared order endpoints — order tracking (feature-flagged) + authenticated
/// order history. Registered for BOTH verticals. The vertical-specific checkout
/// (which creates the order) lives in each vertical's module.
/// </summary>
public static class OrdersEndpoints
{
    public static IEndpointRouteBuilder MapOrderTracking(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/orders/{orderNumber}/track", async (string orderNumber, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetOrderTrackingQuery(orderNumber), ct)))
            .WithTags("Orders")
            .WithName("TrackOrder")
            .WithSummary("Track an order by its number.")
            .RequireRateLimiting("public");

        // Authenticated order history.
        app.MapGet("/api/v1/orders", async (int? page, int? pageSize, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetMyOrdersQuery(page ?? 1, pageSize ?? 20), ct)))
            .WithTags("Orders")
            .WithName("GetMyOrders")
            .WithSummary("List the authenticated user's orders.")
            .RequireAuthorization();

        return app;
    }
}
