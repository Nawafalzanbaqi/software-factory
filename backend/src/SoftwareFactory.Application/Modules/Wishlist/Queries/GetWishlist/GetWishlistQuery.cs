using MediatR;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Wishlist.Queries.GetWishlist;

/// <summary>GET /api/v1/wishlist  (auth, feature: wishlist).</summary>
public sealed record GetWishlistQuery : IRequest<IReadOnlyList<ProductDto>>;
