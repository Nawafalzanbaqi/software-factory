using MediatR;
using SoftwareFactory.Application.Modules.Orders.Dtos;

namespace SoftwareFactory.Application.Modules.Orders.OrderTracking;

/// <summary>
/// GET /api/v1/orders/{orderNumber}/track  (feature: orderTracking).
/// </summary>
public sealed record GetOrderTrackingQuery(string OrderNumber) : IRequest<OrderTrackingDto>;
