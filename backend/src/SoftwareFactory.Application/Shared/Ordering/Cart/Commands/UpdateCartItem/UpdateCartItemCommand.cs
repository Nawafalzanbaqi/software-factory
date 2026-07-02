using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Cart.Commands.UpdateCartItem;

/// <summary>PUT /api/v1/cart/items/{itemId}  { quantity }.</summary>
public sealed record UpdateCartItemCommand(
    Guid CartId,
    Guid ItemId,
    int Quantity) : IRequest<CartDto>;
