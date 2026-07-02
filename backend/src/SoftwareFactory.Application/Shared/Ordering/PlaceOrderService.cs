using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Integrations;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering;

/// <summary>Customer contact block shared by every vertical's checkout.</summary>
public sealed record CustomerInfo(string Name, string Email, string Phone);

/// <summary>
/// Input to the shared <see cref="PlaceOrderService"/>. Exactly one of
/// <see cref="ShippingAddress"/> (e-commerce) or <see cref="Fulfillment"/>
/// (restaurant) is expected to be set.
/// </summary>
public sealed record PlaceOrderRequest(
    Guid CartId,
    CustomerInfo Customer,
    string PaymentMethod,
    ShippingAddress? ShippingAddress = null,
    Fulfillment? Fulfillment = null);

/// <summary>
/// Generic ordering pipeline: turns a cart + fulfillment into an <see cref="Order"/>,
/// initiates payment, clears the cart and commits (which dispatches
/// <c>OrderPlacedDomainEvent</c>). Both the e-commerce and restaurant checkouts
/// call this so the ordering flow lives in exactly one place.
/// </summary>
public sealed class PlaceOrderService
{
    private readonly ICartRepository _carts;
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IPaymentGateway _paymentGateway;

    public PlaceOrderService(
        ICartRepository carts,
        IOrderRepository orders,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IPaymentGateway paymentGateway)
    {
        _carts = carts;
        _orders = orders;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _paymentGateway = paymentGateway;
    }

    public async Task<Order> PlaceAsync(PlaceOrderRequest request, CancellationToken cancellationToken)
    {
        var cart = await _carts.GetByIdAsync(request.CartId, cancellationToken)
                   ?? throw new NotFoundException("Cart", request.CartId);

        if (cart.Items.Count == 0)
        {
            throw new Common.Exceptions.ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(nameof(request.CartId), "Cannot checkout an empty cart.")
            });
        }

        var orderNumber = await GenerateUniqueOrderNumberAsync(cancellationToken);

        var items = cart.Items.Select(i =>
            new OrderItem(i.ItemId, i.NameEn, i.NameAr, i.UnitPrice, i.Quantity, i.Slug, i.ImageUrl));

        var order = Order.Place(
            orderNumber,
            request.Customer.Name,
            request.Customer.Email,
            request.Customer.Phone,
            request.PaymentMethod,
            cart.Currency,
            items,
            request.ShippingAddress,
            request.Fulfillment,
            _currentUser.UserId);

        // TODO(phase-3): invoke a real payment provider here (tamara/tabi/mada).
        // Phase 1/2 use a no-op gateway that always accepts.
        await _paymentGateway.InitiateAsync(
            order.OrderNumber, order.Total.Amount, order.Currency, order.PaymentMethod, cancellationToken);

        await _orders.AddAsync(order, cancellationToken);

        // Clear the cart now that it has been converted to an order.
        cart.Clear();
        _carts.Remove(cart);

        // SaveChanges dispatches OrderPlacedDomainEvent to its handler(s).
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return order;
    }

    private async Task<string> GenerateUniqueOrderNumberAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var candidate = $"SF-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(100000, 999999)}";
            if (!await _orders.OrderNumberExistsAsync(candidate, cancellationToken))
            {
                return candidate;
            }
        }

        return $"SF-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }
}
