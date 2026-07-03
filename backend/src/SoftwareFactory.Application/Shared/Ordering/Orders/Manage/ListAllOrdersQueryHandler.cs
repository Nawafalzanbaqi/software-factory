using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Shared.Ordering.Dtos;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

public sealed class ListAllOrdersQueryHandler
    : IRequestHandler<ListAllOrdersQuery, PagedResult<OrderDto>>
{
    private readonly IOrderRepository _orders;

    public ListAllOrdersQueryHandler(IOrderRepository orders) => _orders = orders;

    public async Task<PagedResult<OrderDto>> Handle(ListAllOrdersQuery request, CancellationToken cancellationToken)
    {
        OrderStatus? status = null;
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            // The validator guarantees the name parses; TryParse keeps the handler total.
            if (Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var parsed))
            {
                status = parsed;
            }
        }

        var page = await _orders.GetPagedAsync(request.Page, request.PageSize, status, cancellationToken);
        var items = page.Items.Select(o => o.ToDto()).ToList();

        return new PagedResult<OrderDto>(items, page.Page, page.PageSize, page.TotalCount);
    }
}
