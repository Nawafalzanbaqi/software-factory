using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Cart.Queries.GetCart;

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
