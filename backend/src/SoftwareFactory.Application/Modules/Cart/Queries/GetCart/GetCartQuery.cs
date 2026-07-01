using MediatR;
using SoftwareFactory.Application.Modules.Cart.Dtos;

namespace SoftwareFactory.Application.Modules.Cart.Queries.GetCart;

/// <summary>GET /api/v1/cart/{cartId}</summary>
public sealed record GetCartQuery(Guid CartId) : IRequest<CartDto>;
