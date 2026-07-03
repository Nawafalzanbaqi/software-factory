using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

/// <summary>
/// POST /api/v1/manage/orders/{orderNumber}/status — advance an order's
/// lifecycle from the client dashboard. <paramref name="Status"/> is an
/// <see cref="Domain.Shared.Ordering.OrderStatus"/> name; the transition itself
/// is the existing <c>Order.TransitionTo</c> domain behavior (no new ordering
/// logic lives here).
/// </summary>
public sealed record TransitionOrderStatusCommand(string OrderNumber, string Status)
    : IRequest<ManagedOrderDto>;
