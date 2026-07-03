using NSubstitute;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Application.Shared.Ordering.Orders.Manage;
using SoftwareFactory.Domain.Shared.Ordering;
using SoftwareFactory.Domain.ValueObjects;
using Xunit;

namespace SoftwareFactory.Application.Tests.Shared.Ordering.Manage;

public class ListAllOrdersQueryTests
{
    private readonly IOrderRepository _orders = Substitute.For<IOrderRepository>();

    internal static Order SampleOrder(string number, string customer = "Jane Doe")
    {
        var items = new[]
        {
            new OrderItem(Guid.NewGuid(), "Item EN", "Item AR", new Money(50m, "SAR"), 2, "item-slug"),
        };
        return Order.Place(number, customer, "jane@example.com", "+966500000000", "cod", "SAR", items);
    }

    [Fact]
    public async Task Handle_maps_orders_and_preserves_paging()
    {
        var orders = new List<Order> { SampleOrder("ORD-1"), SampleOrder("ORD-2") };
        _orders
            .GetPagedAsync(1, 20, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<Order>(orders, 1, 20, 2));

        var handler = new ListAllOrdersQueryHandler(_orders);

        var result = await handler.Handle(new ListAllOrdersQuery(), CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
        Assert.Collection(result.Items,
            o => Assert.Equal("ORD-1", o.OrderNumber),
            o => Assert.Equal("ORD-2", o.OrderNumber));
        // Wire-compat: the shared OrderDto shape (100 = 50 x 2).
        Assert.Equal(100m, result.Items[0].Total);
        Assert.Equal("Pending", result.Items[0].Status);
    }

    [Fact]
    public async Task Handle_parses_status_filter_case_insensitively()
    {
        _orders
            .GetPagedAsync(1, 20, OrderStatus.Shipped, Arg.Any<CancellationToken>())
            .Returns(PagedResult<Order>.Empty(1, 20));

        var handler = new ListAllOrdersQueryHandler(_orders);

        await handler.Handle(new ListAllOrdersQuery(Status: "shipped"), CancellationToken.None);

        await _orders.Received(1)
            .GetPagedAsync(1, 20, OrderStatus.Shipped, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0, 20, null, false)]      // page < 1
    [InlineData(1, 0, null, false)]       // pageSize < 1
    [InlineData(1, 200, null, false)]     // pageSize > 100
    [InlineData(1, 20, "bogus", false)]   // unknown status name
    [InlineData(1, 20, "3", false)]       // numeric enum value rejected (names only)
    [InlineData(1, 20, "Delivered", true)]
    [InlineData(1, 20, "cancelled", true)] // case-insensitive
    [InlineData(1, 20, null, true)]
    public void Validator_enforces_paging_and_status_names(int page, int pageSize, string? status, bool expectedValid)
    {
        var validator = new ListAllOrdersQueryValidator();
        var result = validator.Validate(new ListAllOrdersQuery(page, pageSize, status));
        Assert.Equal(expectedValid, result.IsValid);
    }
}
