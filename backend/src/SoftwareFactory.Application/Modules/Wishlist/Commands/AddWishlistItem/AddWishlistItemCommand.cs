using MediatR;

namespace SoftwareFactory.Application.Modules.Wishlist.Commands.AddWishlistItem;

/// <summary>POST /api/v1/wishlist/items  { productId }  (auth).</summary>
public sealed record AddWishlistItemCommand(Guid ProductId) : IRequest<Unit>;
