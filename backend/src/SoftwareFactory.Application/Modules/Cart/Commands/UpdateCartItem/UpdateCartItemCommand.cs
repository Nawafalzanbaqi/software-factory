using MediatR;
using SoftwareFactory.Application.Modules.Cart.Dtos;

namespace SoftwareFactory.Application.Modules.Cart.Commands.UpdateCartItem;

/// <summary>PUT /api/v1/cart/items/{itemId}  { quantity }.</summary>
public sealed record UpdateCartItemCommand(
    Guid CartId,
    Guid ItemId,
    int Quantity) : IRequest<CartDto>;
