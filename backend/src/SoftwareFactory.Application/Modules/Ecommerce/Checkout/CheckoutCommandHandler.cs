using MediatR;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Application.Shared.Ordering.Dtos;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Modules.Ecommerce.Checkout;

public sealed class CheckoutCommandHandler : IRequestHandler<CheckoutCommand, OrderDto>
{
    private readonly PlaceOrderService _placeOrder;

    public CheckoutCommandHandler(PlaceOrderService placeOrder) => _placeOrder = placeOrder;

    public async Task<OrderDto> Handle(CheckoutCommand request, CancellationToken cancellationToken)
    {
        var order = await _placeOrder.PlaceAsync(
            new PlaceOrderRequest(
                request.CartId,
                request.Customer,
                request.PaymentMethod,
                ShippingAddress: new ShippingAddress(request.ShippingAddress),
                Fulfillment: null),
            cancellationToken);

        return order.ToDto();
    }
}
