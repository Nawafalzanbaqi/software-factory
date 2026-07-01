using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Orders.Dtos;

namespace SoftwareFactory.Application.Modules.Orders.OrderHistory;

/// <summary>
/// GET /api/v1/orders — order history for the authenticated user.
/// </summary>
public sealed record GetMyOrdersQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResult<OrderDto>>;
