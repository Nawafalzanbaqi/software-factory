using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Cart.Queries.GetCart;

/// <summary>GET /api/v1/cart/{cartId}</summary>
public sealed record GetCartQuery(Guid CartId) : IRequest<CartDto>;
