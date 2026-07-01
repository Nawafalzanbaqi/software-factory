using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Cart.Dtos;

namespace SoftwareFactory.Application.Modules.Cart.Commands.UpdateCartItem;

public sealed class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, CartDto>
{
    private readonly ICartRepository _carts;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCartItemCommandHandler(ICartRepository carts, IUnitOfWork unitOfWork)
    {
        _carts = carts;
        _unitOfWork = unitOfWork;
    }

    public async Task<CartDto> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
    {
        var cart = await _carts.GetByIdAsync(request.CartId, cancellationToken)
                   ?? throw new NotFoundException("Cart", request.CartId);

        cart.UpdateItemQuantity(request.ItemId, request.Quantity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return cart.ToDto();
    }
}
