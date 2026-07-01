using FluentValidation;

namespace SoftwareFactory.Application.Modules.Cart.Commands.AddCartItem;

public sealed class AddCartItemCommandValidator : AbstractValidator<AddCartItemCommand>
{
    public AddCartItemCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("ProductId is required.");
        RuleFor(x => x.Quantity).InclusiveBetween(1, 999).WithMessage("Quantity must be between 1 and 999.");
    }
}
