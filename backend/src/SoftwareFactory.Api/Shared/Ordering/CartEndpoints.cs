using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Cart.Commands.AddCartItem;
using SoftwareFactory.Application.Shared.Ordering.Cart.Commands.RemoveCartItem;
using SoftwareFactory.Application.Shared.Ordering.Cart.Commands.UpdateCartItem;
using SoftwareFactory.Application.Shared.Ordering.Cart.Queries.GetCart;

namespace SoftwareFactory.Api.Shared.Ordering;

public sealed record AddCartItemRequest(Guid ProductId, int Quantity);
public sealed record UpdateCartItemRequest(int Quantity);

/// <summary>
/// Shared cart endpoints — registered for BOTH verticals. Routes are identical
/// to Phase 1 (<c>/api/v1/cart/*</c>) and the body field stays <c>productId</c>
/// (the generic catalog-item id).
/// </summary>
public static class CartEndpoints
{
    public static IEndpointRouteBuilder MapCart(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/cart").WithTags("Cart").RequireRateLimiting("public");

        group.MapGet("/{cartId:guid}", async (Guid cartId, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetCartQuery(cartId), ct)))
            .WithName("GetCart");

        group.MapPost("/items", async (
            AddCartItemRequest body,
            Guid? cartId,
            ISender sender,
            CancellationToken ct) =>
        {
            var cart = await sender.Send(new AddCartItemCommand(cartId, body.ProductId, body.Quantity), ct);
            return Results.Ok(cart);
        })
            .WithName("AddCartItem")
            .WithSummary("Add an item to the cart (creates a cart when 'cartId' is omitted).");

        group.MapPut("/items/{itemId:guid}", async (
            Guid itemId,
            Guid cartId,
            UpdateCartItemRequest body,
            ISender sender,
            CancellationToken ct) =>
        {
            var cart = await sender.Send(new UpdateCartItemCommand(cartId, itemId, body.Quantity), ct);
            return Results.Ok(cart);
        })
            .WithName("UpdateCartItem");

        group.MapDelete("/items/{itemId:guid}", async (
            Guid itemId,
            Guid cartId,
            ISender sender,
            CancellationToken ct) =>
        {
            var cart = await sender.Send(new RemoveCartItemCommand(cartId, itemId), ct);
            return Results.Ok(cart);
        })
            .WithName("RemoveCartItem");

        return app;
    }
}
