using MediatR;
using SoftwareFactory.Application.Modules.Orders.Checkout;
using SoftwareFactory.Application.Modules.Orders.OrderHistory;
using SoftwareFactory.Application.Modules.Orders.OrderTracking;

namespace SoftwareFactory.Api.Modules.Orders;

public sealed record CheckoutRequest(
    Guid CartId,
    CustomerInfo Customer,
    string ShippingAddress,
    string PaymentMethod);

/// <summary>
/// Orders module: checkout (anonymous), order tracking (feature-flagged) and
/// authenticated order history.
/// </summary>
public static class OrdersEndpoints
{
    /// <summary>Checkout is a core flow — always mapped.</summary>
    public static IEndpointRouteBuilder MapCheckout(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/checkout", async (CheckoutRequest body, ISender sender, CancellationToken ct) =>
        {
            var order = await sender.Send(
                new CheckoutCommand(body.CartId, body.Customer, body.ShippingAddress, body.PaymentMethod), ct);
            return Results.Ok(order);
        })
            .WithTags("Orders")
            .WithName("Checkout")
            .WithSummary("Create an order from a cart.")
            .RequireRateLimiting("public");

        return app;
    }

    /// <summary>Order tracking — gated behind features.orderTracking.</summary>
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
