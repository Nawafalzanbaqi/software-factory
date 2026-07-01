using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Integrations;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Cart;
using SoftwareFactory.Application.Modules.Orders.Dtos;
using SoftwareFactory.Domain.Modules.Orders;

namespace SoftwareFactory.Application.Modules.Orders.Checkout;

public sealed class CheckoutCommandHandler : IRequestHandler<CheckoutCommand, OrderDto>
{
    private readonly ICartRepository _carts;
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IPaymentGateway _paymentGateway;

    public CheckoutCommandHandler(
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

    public async Task<OrderDto> Handle(CheckoutCommand request, CancellationToken cancellationToken)
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
            new OrderItem(i.ProductId, i.ProductNameEn, i.ProductNameAr, i.UnitPrice, i.Quantity));

        var order = Order.Place(
            orderNumber,
            request.Customer.Name,
            request.Customer.Email,
            request.Customer.Phone,
            request.ShippingAddress,
            request.PaymentMethod,
            cart.Currency,
            items,
            _currentUser.UserId);

        // TODO (backlog): OUT OF SCOPE — invoke real payment provider here
        // (tamara/tabi). Phase 1 uses a no-op gateway that always accepts.
        await _paymentGateway.InitiateAsync(
            order.OrderNumber, order.Total.Amount, order.Currency, order.PaymentMethod, cancellationToken);

        await _orders.AddAsync(order, cancellationToken);

        // Clear the cart now that it has been converted to an order.
        cart.Clear();
        _carts.Remove(cart);

        // SaveChanges dispatches OrderPlacedDomainEvent to its handler(s).
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return order.ToDto();
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
