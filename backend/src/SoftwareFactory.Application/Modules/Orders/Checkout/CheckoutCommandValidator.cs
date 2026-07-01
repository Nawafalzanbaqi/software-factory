using FluentValidation;

namespace SoftwareFactory.Application.Modules.Orders.Checkout;

public sealed class CheckoutCommandValidator : AbstractValidator<CheckoutCommand>
{
    private static readonly string[] AllowedMethods = { "tamara", "tabi", "cod", "mada", "card" };

    public CheckoutCommandValidator()
    {
        RuleFor(x => x.CartId).NotEmpty();
        RuleFor(x => x.ShippingAddress).NotEmpty().MaximumLength(500);

        RuleFor(x => x.PaymentMethod)
            .NotEmpty()
            .Must(m => AllowedMethods.Contains(m.ToLowerInvariant()))
            .WithMessage($"PaymentMethod must be one of: {string.Join(", ", AllowedMethods)}.");

        RuleFor(x => x.Customer).NotNull();
        RuleFor(x => x.Customer.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Customer.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Customer.Phone).NotEmpty().MaximumLength(30);
    }
}
