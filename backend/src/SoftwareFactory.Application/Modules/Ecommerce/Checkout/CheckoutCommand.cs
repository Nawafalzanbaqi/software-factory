using MediatR;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Application.Shared.Ordering.Dtos;

namespace SoftwareFactory.Application.Modules.Ecommerce.Checkout;

/// <summary>
/// POST /api/v1/checkout  { cartId, customer, shippingAddress, paymentMethod }.
/// E-commerce checkout — captures a shipping address + payment and calls the
/// shared PlaceOrder with a shipping fulfillment. Route + body UNCHANGED from
/// Phase 1.
/// </summary>
public sealed record CheckoutCommand(
    Guid CartId,
    CustomerInfo Customer,
    string ShippingAddress,
    string PaymentMethod) : IRequest<OrderDto>;
