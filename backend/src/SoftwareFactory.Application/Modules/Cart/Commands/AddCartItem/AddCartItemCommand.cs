using MediatR;
using SoftwareFactory.Application.Modules.Cart.Dtos;

namespace SoftwareFactory.Application.Modules.Cart.Commands.AddCartItem;

/// <summary>
/// POST /api/v1/cart/items  { productId, quantity }.
/// If <see cref="CartId"/> is null a new cart is created and returned.
/// </summary>
public sealed record AddCartItemCommand(
    Guid? CartId,
    Guid ProductId,
    int Quantity) : IRequest<CartDto>;
