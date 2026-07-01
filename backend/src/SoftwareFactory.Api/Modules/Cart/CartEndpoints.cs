using MediatR;
using SoftwareFactory.Application.Modules.Cart.Commands.AddCartItem;
using SoftwareFactory.Application.Modules.Cart.Commands.RemoveCartItem;
using SoftwareFactory.Application.Modules.Cart.Commands.UpdateCartItem;
using SoftwareFactory.Application.Modules.Cart.Queries.GetCart;

namespace SoftwareFactory.Api.Modules.Cart;

public sealed record AddCartItemRequest(Guid ProductId, int Quantity);
public sealed record UpdateCartItemRequest(int Quantity);

/// <summary>
/// Cart module endpoints. The cart id is passed as a query parameter for
/// item mutations so the JSON bodies match the shared REST contract.
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
