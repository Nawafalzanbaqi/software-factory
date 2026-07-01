using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Orders.Dtos;

namespace SoftwareFactory.Application.Modules.Orders.OrderHistory;

public sealed class GetMyOrdersQueryHandler
    : IRequestHandler<GetMyOrdersQuery, PagedResult<OrderDto>>
{
    private readonly IOrderRepository _orders;
    private readonly ICurrentUser _currentUser;

    public GetMyOrdersQueryHandler(IOrderRepository orders, ICurrentUser currentUser)
    {
        _orders = orders;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<OrderDto>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
        {
            throw new UnauthorizedAccessException("Authentication is required to view order history.");
        }

        var page = await _orders.GetForUserAsync(_currentUser.UserId, request.Page, request.PageSize, cancellationToken);
        var items = page.Items.Select(o => o.ToDto()).ToList();

        return new PagedResult<OrderDto>(items, page.Page, page.PageSize, page.TotalCount);
    }
}
