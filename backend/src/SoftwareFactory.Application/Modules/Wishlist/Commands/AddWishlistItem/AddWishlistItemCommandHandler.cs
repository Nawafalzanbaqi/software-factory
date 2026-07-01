using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Domain.Modules.Wishlist;

namespace SoftwareFactory.Application.Modules.Wishlist.Commands.AddWishlistItem;

public sealed class AddWishlistItemCommandHandler : IRequestHandler<AddWishlistItemCommand, Unit>
{
    private readonly IWishlistRepository _wishlist;
    private readonly IProductRepository _products;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public AddWishlistItemCommandHandler(
        IWishlistRepository wishlist,
        IProductRepository products,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser)
    {
        _wishlist = wishlist;
        _products = products;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(AddWishlistItemCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
        {
            throw new UnauthorizedAccessException("Authentication is required for the wishlist.");
        }

        var userId = _currentUser.UserId;

        _ = await _products.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException("Product", request.ProductId);

        if (!await _wishlist.ExistsAsync(userId, request.ProductId, cancellationToken))
        {
            await _wishlist.AddAsync(new WishlistItem(userId, request.ProductId), cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}
