using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Application.Shared.Ordering.Dtos;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Modules.Restaurant.Checkout;

/// <summary>
/// POST /api/v1/checkout (restaurant vertical).
/// Captures the fulfillment (dine-in / pickup / delivery) and calls the shared
/// PlaceOrder with a food fulfillment. Returns the placed order (incl. orderNumber).
/// </summary>
public sealed record PlaceFoodOrderCommand(
    Guid CartId,
    CustomerInfo Customer,
    string FulfillmentType,
    Guid? BranchId,
    Guid? TableId,
    string? DeliveryAddress,
    DateTimeOffset? ScheduledFor,
    string PaymentMethod) : IRequest<OrderDto>;

public sealed class PlaceFoodOrderCommandHandler : IRequestHandler<PlaceFoodOrderCommand, OrderDto>
{
    private readonly PlaceOrderService _placeOrder;

    public PlaceFoodOrderCommandHandler(PlaceOrderService placeOrder) => _placeOrder = placeOrder;

    public async Task<OrderDto> Handle(PlaceFoodOrderCommand request, CancellationToken cancellationToken)
    {
        var type = ParseType(request.FulfillmentType);

        var fulfillment = new Fulfillment(
            type,
            request.BranchId,
            type == FulfillmentType.DineIn ? request.TableId : null,
            request.ScheduledFor,
            type == FulfillmentType.Delivery ? request.DeliveryAddress : null);

        var order = await _placeOrder.PlaceAsync(
            new PlaceOrderRequest(
                request.CartId,
                request.Customer,
                request.PaymentMethod,
                ShippingAddress: null,
                Fulfillment: fulfillment),
            cancellationToken);

        return order.ToDto();
    }

    internal static FulfillmentType ParseType(string value) => value?.Trim().ToLowerInvariant() switch
    {
        "dinein" or "dine-in" or "dine_in" => FulfillmentType.DineIn,
        "pickup" => FulfillmentType.Pickup,
        "delivery" => FulfillmentType.Delivery,
        _ => throw new ArgumentOutOfRangeException(nameof(value), $"Unknown fulfillment type '{value}'.")
    };
}

public sealed class PlaceFoodOrderCommandValidator : AbstractValidator<PlaceFoodOrderCommand>
{
    private static readonly string[] AllowedTypes = { "dinein", "dine-in", "dine_in", "pickup", "delivery" };
    private static readonly string[] AllowedMethods = { "tamara", "tabi", "cod", "mada", "card" };

    public PlaceFoodOrderCommandValidator()
    {
        RuleFor(x => x.CartId).NotEmpty();

        RuleFor(x => x.FulfillmentType)
            .NotEmpty()
            .Must(t => AllowedTypes.Contains(t.ToLowerInvariant()))
            .WithMessage("FulfillmentType must be one of: dinein, pickup, delivery.");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty()
            .Must(m => AllowedMethods.Contains(m.ToLowerInvariant()))
            .WithMessage($"PaymentMethod must be one of: {string.Join(", ", AllowedMethods)}.");

        // Dine-in and pickup require a branch.
        RuleFor(x => x.BranchId)
            .NotNull().NotEqual(Guid.Empty)
            .When(x => IsBranchRequired(x.FulfillmentType))
            .WithMessage("BranchId is required for dine-in and pickup orders.");

        // Delivery requires an address.
        RuleFor(x => x.DeliveryAddress)
            .NotEmpty().MaximumLength(500)
            .When(x => string.Equals(x.FulfillmentType?.Trim(), "delivery", StringComparison.OrdinalIgnoreCase))
            .WithMessage("DeliveryAddress is required for delivery orders.");

        RuleFor(x => x.Customer).NotNull();
        RuleFor(x => x.Customer.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Customer.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Customer.Phone).NotEmpty().MaximumLength(30);
    }

    private static bool IsBranchRequired(string? type)
    {
        var t = type?.Trim().ToLowerInvariant();
        return t is "dinein" or "dine-in" or "dine_in" or "pickup";
    }
}
