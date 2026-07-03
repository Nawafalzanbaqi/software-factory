using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Shared.Ordering.Dtos;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

public sealed class TransitionOrderStatusCommandHandler
    : IRequestHandler<TransitionOrderStatusCommand, ManagedOrderDto>
{
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _unitOfWork;

    public TransitionOrderStatusCommandHandler(IOrderRepository orders, IUnitOfWork unitOfWork)
    {
        _orders = orders;
        _unitOfWork = unitOfWork;
    }

    public async Task<ManagedOrderDto> Handle(TransitionOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _orders.GetByOrderNumberAsync(request.OrderNumber, cancellationToken)
                    ?? throw new NotFoundException("Order", request.OrderNumber);

        // Validator guarantees the name parses (names only, case-insensitive).
        var status = Enum.Parse<OrderStatus>(request.Status, ignoreCase: true);

        order.TransitionTo(status);
        // The appended timeline entry must be registered as an insert — graph
        // discovery alone would misread it as an update to a nonexistent row.
        _orders.TrackTimelineAppends(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return order.ToManagedDto();
    }
}
