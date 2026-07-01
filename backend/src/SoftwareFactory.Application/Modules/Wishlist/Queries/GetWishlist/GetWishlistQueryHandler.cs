using MediatR;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Wishlist.Queries.GetWishlist;

public sealed class GetWishlistQueryHandler
    : IRequestHandler<GetWishlistQuery, IReadOnlyList<ProductDto>>
{
    private readonly IWishlistRepository _wishlist;
    private readonly IProductRepository _products;
    private readonly ICurrentUser _currentUser;

    public GetWishlistQueryHandler(
        IWishlistRepository wishlist,
        IProductRepository products,
        ICurrentUser currentUser)
    {
        _wishlist = wishlist;
        _products = products;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ProductDto>> Handle(GetWishlistQuery request, CancellationToken cancellationToken)
    {
        var userId = RequireUser();

        var items = await _wishlist.GetForUserAsync(userId, cancellationToken);
        var productIds = items.Select(i => i.ProductId).ToList();
        if (productIds.Count == 0)
        {
            return Array.Empty<ProductDto>();
        }

        var products = await _products.GetByIdsAsync(productIds, cancellationToken);
        return products.Select(p => p.ToDto()).ToList();
    }

    private string RequireUser()
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
        {
            throw new UnauthorizedAccessException("Authentication is required for the wishlist.");
        }

        return _currentUser.UserId;
    }
}
