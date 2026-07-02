using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Checkout;
using SoftwareFactory.Application.Modules.Restaurant.Search;
using SoftwareFactory.Application.Shared.Ordering;

namespace SoftwareFactory.Api.Modules.Restaurant;

public sealed record PlaceFoodOrderRequest(
    Guid CartId,
    CustomerInfo Customer,
    string FulfillmentType,
    Guid? BranchId,
    Guid? TableId,
    string? DeliveryAddress,
    DateTimeOffset? ScheduledFor,
    string PaymentMethod);

/// <summary>
/// Restaurant checkout (POST /api/v1/checkout) + restaurant search
/// (GET /api/v1/search over menu items). Registered only when siteType=restaurant.
/// </summary>
public static class RestaurantCheckoutEndpoints
{
    public static IEndpointRouteBuilder MapRestaurantCheckout(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/checkout", async (PlaceFoodOrderRequest body, ISender sender, CancellationToken ct) =>
        {
            var order = await sender.Send(new PlaceFoodOrderCommand(
                body.CartId, body.Customer, body.FulfillmentType, body.BranchId,
                body.TableId, body.DeliveryAddress, body.ScheduledFor, body.PaymentMethod), ct);
            return Results.Ok(new { orderNumber = order.OrderNumber, order });
        })
            .WithTags("Orders")
            .WithName("PlaceFoodOrder")
            .WithSummary("Create a food order from a cart (restaurant).")
            .RequireRateLimiting("public");

        return app;
    }

    public static IEndpointRouteBuilder MapRestaurantSearch(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/search", async (string q, int? limit, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new SearchMenuItemsQuery(q ?? string.Empty, limit ?? 20), ct)))
            .WithTags("Search")
            .WithName("SearchMenuItems")
            .WithSummary("Full-text menu-item search.")
            .RequireRateLimiting("public");

        return app;
    }
}
