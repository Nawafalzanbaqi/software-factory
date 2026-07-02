using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Cart.Commands.AddCartItem;

/// <summary>
/// POST /api/v1/cart/items  { productId, quantity }.
/// If <see cref="CartId"/> is null a new cart is created and returned.
/// <c>ProductId</c> is the generic catalog-item id (wire-compat name).
/// </summary>
public sealed record AddCartItemCommand(
    Guid? CartId,
    Guid ProductId,
    int Quantity) : IRequest<CartDto>;
