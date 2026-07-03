using NSubstitute;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Application.Shared.Ordering.Orders.Manage;
using SoftwareFactory.Domain.Shared.Ordering;
using Xunit;

namespace SoftwareFactory.Application.Tests.Shared.Ordering.Manage;

public class GetManagedOrderQueryTests
{
    private readonly IOrderRepository _orders = Substitute.For<IOrderRepository>();

    [Fact]
    public async Task Handle_returns_staff_detail_with_customer_and_timeline()
    {
        var order = ListAllOrdersQueryTests.SampleOrder("ORD-42", customer: "Store Customer");
        _orders.GetByOrderNumberAsync("ORD-42", Arg.Any<CancellationToken>()).Returns(order);

        var handler = new GetManagedOrderQueryHandler(_orders);

        var dto = await handler.Handle(new GetManagedOrderQuery("ORD-42"), CancellationToken.None);

        Assert.Equal("ORD-42", dto.OrderNumber);
        Assert.Equal("Store Customer", dto.CustomerName);
        Assert.Equal("jane@example.com", dto.CustomerEmail);
        Assert.Equal("Pending", dto.Status);
        Assert.Single(dto.Items);
        Assert.Single(dto.Timeline); // Place() seeds the Pending timeline entry
        Assert.Null(dto.ShippingAddress);
        Assert.Null(dto.Fulfillment);
    }

    [Fact]
    public async Task Handle_throws_not_found_for_unknown_order()
    {
        _orders.GetByOrderNumberAsync("MISSING", Arg.Any<CancellationToken>())
            .Returns((Order?)null);

        var handler = new GetManagedOrderQueryHandler(_orders);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            handler.Handle(new GetManagedOrderQuery("MISSING"), CancellationToken.None));
    }

    [Theory]
    [InlineData("", false)]
    [InlineData("ORD-1", true)]
    public void Validator_requires_order_number(string orderNumber, bool expectedValid)
    {
        var validator = new GetManagedOrderQueryValidator();
        var result = validator.Validate(new GetManagedOrderQuery(orderNumber));
        Assert.Equal(expectedValid, result.IsValid);
    }
}
