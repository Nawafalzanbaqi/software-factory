using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.OrderHistory;

/// <summary>
/// GET /api/v1/orders — order history for the authenticated user.
/// </summary>
public sealed record GetMyOrdersQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResult<OrderDto>>;
