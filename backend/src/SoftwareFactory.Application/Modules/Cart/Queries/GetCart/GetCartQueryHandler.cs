using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Modules.Cart.Dtos;

namespace SoftwareFactory.Application.Modules.Cart.Queries.GetCart;

public sealed class GetCartQueryHandler : IRequestHandler<GetCartQuery, CartDto>
{
    private readonly ICartRepository _carts;

    public GetCartQueryHandler(ICartRepository carts) => _carts = carts;

    public async Task<CartDto> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await _carts.GetByIdAsync(request.CartId, cancellationToken)
                   ?? throw new NotFoundException("Cart", request.CartId);

        return cart.ToDto();
    }
}
