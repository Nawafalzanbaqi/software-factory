using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

/// <summary>
/// GET /api/v1/manage/orders/{orderNumber} — full staff-facing detail for one
/// order (customer, payment, items, timeline, fulfillment).
/// </summary>
public sealed record GetManagedOrderQuery(string OrderNumber) : IRequest<ManagedOrderDto>;
