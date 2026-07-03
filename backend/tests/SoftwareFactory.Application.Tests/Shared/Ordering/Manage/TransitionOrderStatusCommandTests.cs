using NSubstitute;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Application.Shared.Ordering.Orders.Manage;
using SoftwareFactory.Domain.Shared.Ordering;
using Xunit;

namespace SoftwareFactory.Application.Tests.Shared.Ordering.Manage;

public class TransitionOrderStatusCommandTests
{
    private readonly IOrderRepository _orders = Substitute.For<IOrderRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task Handle_transitions_via_domain_behavior_and_saves()
    {
        var order = ListAllOrdersQueryTests.SampleOrder("ORD-7");
        _orders.GetByOrderNumberAsync("ORD-7", Arg.Any<CancellationToken>()).Returns(order);

        var handler = new TransitionOrderStatusCommandHandler(_orders, _unitOfWork);

        var dto = await handler.Handle(
            new TransitionOrderStatusCommand("ORD-7", "processing"), CancellationToken.None);

        Assert.Equal("Processing", dto.Status);
        Assert.Equal(OrderStatus.Processing, order.Status);
        // The domain appends to the timeline (Pending from Place + the transition).
        Assert.Equal(2, dto.Timeline.Count);
        Assert.Equal("Processing", dto.Timeline[^1].Status);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_throws_not_found_and_does_not_save_for_unknown_order()
    {
        _orders.GetByOrderNumberAsync("MISSING", Arg.Any<CancellationToken>())
            .Returns((Order?)null);

        var handler = new TransitionOrderStatusCommandHandler(_orders, _unitOfWork);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            handler.Handle(new TransitionOrderStatusCommand("MISSING", "Shipped"), CancellationToken.None));
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("ORD-1", "Shipped", true)]
    [InlineData("ORD-1", "delivered", true)] // case-insensitive name
    [InlineData("ORD-1", "bogus", false)]
    [InlineData("ORD-1", "4", false)]        // numeric enum value rejected
    [InlineData("ORD-1", "", false)]
    [InlineData("", "Shipped", false)]
    public void Validator_enforces_order_number_and_status_names(string orderNumber, string status, bool expectedValid)
    {
        var validator = new TransitionOrderStatusCommandValidator();
        var result = validator.Validate(new TransitionOrderStatusCommand(orderNumber, status));
        Assert.Equal(expectedValid, result.IsValid);
    }
}
