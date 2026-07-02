using MediatR;
using SoftwareFactory.Application.Modules.Ecommerce.Checkout;
using SoftwareFactory.Application.Shared.Ordering;

namespace SoftwareFactory.Api.Modules.Ecommerce;

public sealed record CheckoutRequest(
    Guid CartId,
    CustomerInfo Customer,
    string ShippingAddress,
    string PaymentMethod);

/// <summary>
/// E-commerce checkout — POST /api/v1/checkout (UNCHANGED from Phase 1).
/// Registered only when siteType=ecommerce.
/// </summary>
public static class CheckoutEndpoints
{
    public static IEndpointRouteBuilder MapEcommerceCheckout(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/checkout", async (CheckoutRequest body, ISender sender, CancellationToken ct) =>
        {
            var order = await sender.Send(
                new CheckoutCommand(body.CartId, body.Customer, body.ShippingAddress, body.PaymentMethod), ct);
            return Results.Ok(order);
        })
            .WithTags("Orders")
            .WithName("Checkout")
            .WithSummary("Create an order from a cart (e-commerce).")
            .RequireRateLimiting("public");

        return app;
    }
}
