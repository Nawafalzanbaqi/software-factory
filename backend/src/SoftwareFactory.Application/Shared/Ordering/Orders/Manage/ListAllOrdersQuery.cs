using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

/// <summary>
/// GET /api/v1/manage/orders — every order in the store, newest first, for the
/// client dashboard (staff/owner only). Optional <paramref name="Status"/>
/// filter takes an <see cref="Domain.Shared.Ordering.OrderStatus"/> name.
/// </summary>
public sealed record ListAllOrdersQuery(int Page = 1, int PageSize = 20, string? Status = null)
    : IRequest<PagedResult<OrderDto>>;
