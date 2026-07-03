using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

public sealed class GetManagedOrderQueryHandler
    : IRequestHandler<GetManagedOrderQuery, ManagedOrderDto>
{
    private readonly IOrderRepository _orders;

    public GetManagedOrderQueryHandler(IOrderRepository orders) => _orders = orders;

    public async Task<ManagedOrderDto> Handle(GetManagedOrderQuery request, CancellationToken cancellationToken)
    {
        var order = await _orders.GetByOrderNumberAsync(request.OrderNumber, cancellationToken)
                    ?? throw new NotFoundException("Order", request.OrderNumber);

        return order.ToManagedDto();
    }
}
