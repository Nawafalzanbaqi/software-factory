using MediatR;
using SoftwareFactory.Application.Modules.Wishlist.Commands.AddWishlistItem;
using SoftwareFactory.Application.Modules.Wishlist.Commands.RemoveWishlistItem;
using SoftwareFactory.Application.Modules.Wishlist.Queries.GetWishlist;

namespace SoftwareFactory.Api.Modules.Wishlist;

public sealed record AddWishlistItemRequest(Guid ProductId);

/// <summary>
/// Wishlist module — gated behind features.wishlist and requires auth.
/// </summary>
public static class WishlistEndpoints
{
    public static IEndpointRouteBuilder MapWishlist(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/wishlist")
            .WithTags("Wishlist")
            .RequireAuthorization();

        group.MapGet("", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetWishlistQuery(), ct)))
            .WithName("GetWishlist");

        group.MapPost("/items", async (AddWishlistItemRequest body, ISender sender, CancellationToken ct) =>
        {
            await sender.Send(new AddWishlistItemCommand(body.ProductId), ct);
            return Results.NoContent();
        })
            .WithName("AddWishlistItem");

        group.MapDelete("/items/{productId:guid}", async (Guid productId, ISender sender, CancellationToken ct) =>
        {
            await sender.Send(new RemoveWishlistItemCommand(productId), ct);
            return Results.NoContent();
        })
            .WithName("RemoveWishlistItem");

        return app;
    }
}
