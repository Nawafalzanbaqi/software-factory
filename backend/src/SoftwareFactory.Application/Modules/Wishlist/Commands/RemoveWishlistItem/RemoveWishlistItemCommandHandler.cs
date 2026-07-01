using MediatR;
using SoftwareFactory.Application.Common.Interfaces;

namespace SoftwareFactory.Application.Modules.Wishlist.Commands.RemoveWishlistItem;

public sealed class RemoveWishlistItemCommandHandler : IRequestHandler<RemoveWishlistItemCommand, Unit>
{
    private readonly IWishlistRepository _wishlist;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;

    public RemoveWishlistItemCommandHandler(
        IWishlistRepository wishlist,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser)
    {
        _wishlist = wishlist;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(RemoveWishlistItemCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
        {
            throw new UnauthorizedAccessException("Authentication is required for the wishlist.");
        }

        await _wishlist.RemoveAsync(_currentUser.UserId, request.ProductId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
