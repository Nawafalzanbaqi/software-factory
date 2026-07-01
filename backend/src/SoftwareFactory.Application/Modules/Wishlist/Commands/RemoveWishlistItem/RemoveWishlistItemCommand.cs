using MediatR;

namespace SoftwareFactory.Application.Modules.Wishlist.Commands.RemoveWishlistItem;

/// <summary>DELETE /api/v1/wishlist/items/{productId}  (auth).</summary>
public sealed record RemoveWishlistItemCommand(Guid ProductId) : IRequest<Unit>;
