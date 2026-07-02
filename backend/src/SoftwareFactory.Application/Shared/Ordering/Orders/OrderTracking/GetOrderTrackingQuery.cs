using MediatR;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.OrderTracking;

/// <summary>
/// GET /api/v1/orders/{orderNumber}/track  (feature: orderTracking).
/// </summary>
public sealed record GetOrderTrackingQuery(string OrderNumber) : IRequest<OrderTrackingDto>;
