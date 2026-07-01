using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Modules.Orders.Dtos;

namespace SoftwareFactory.Application.Modules.Orders.OrderTracking;

public sealed class GetOrderTrackingQueryHandler
    : IRequestHandler<GetOrderTrackingQuery, OrderTrackingDto>
{
    private readonly IOrderRepository _orders;

    public GetOrderTrackingQueryHandler(IOrderRepository orders) => _orders = orders;

    public async Task<OrderTrackingDto> Handle(GetOrderTrackingQuery request, CancellationToken cancellationToken)
    {
        var order = await _orders.GetByOrderNumberAsync(request.OrderNumber, cancellationToken)
                    ?? throw new NotFoundException("Order", request.OrderNumber);

        return order.ToTrackingDto();
    }
}
