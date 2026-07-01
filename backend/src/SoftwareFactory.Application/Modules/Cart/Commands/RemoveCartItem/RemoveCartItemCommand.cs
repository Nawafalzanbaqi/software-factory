using MediatR;
using SoftwareFactory.Application.Modules.Cart.Dtos;

namespace SoftwareFactory.Application.Modules.Cart.Commands.RemoveCartItem;

/// <summary>DELETE /api/v1/cart/items/{itemId}.</summary>
public sealed record RemoveCartItemCommand(Guid CartId, Guid ItemId) : IRequest<CartDto>;
