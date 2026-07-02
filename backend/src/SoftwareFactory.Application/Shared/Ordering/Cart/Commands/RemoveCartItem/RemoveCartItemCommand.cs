using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Cart.Commands.RemoveCartItem;

/// <summary>DELETE /api/v1/cart/items/{itemId}.</summary>
public sealed record RemoveCartItemCommand(Guid CartId, Guid ItemId) : IRequest<CartDto>;
