using MediatR;
using SoftwareFactory.Application.Modules.Orders.Dtos;

namespace SoftwareFactory.Application.Modules.Orders.Checkout;

public sealed record CustomerInfo(string Name, string Email, string Phone);

/// <summary>
/// POST /api/v1/checkout  { cartId, customer, shippingAddress, paymentMethod }.
/// Creates an Order from the cart and raises OrderPlacedDomainEvent.
/// </summary>
public sealed record CheckoutCommand(
    Guid CartId,
    CustomerInfo Customer,
    string ShippingAddress,
    string PaymentMethod) : IRequest<OrderDto>;
