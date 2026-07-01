using FluentValidation;

namespace SoftwareFactory.Application.Modules.Cart.Commands.UpdateCartItem;

public sealed class UpdateCartItemCommandValidator : AbstractValidator<UpdateCartItemCommand>
{
    public UpdateCartItemCommandValidator()
    {
        RuleFor(x => x.CartId).NotEmpty();
        RuleFor(x => x.ItemId).NotEmpty();
        RuleFor(x => x.Quantity).InclusiveBetween(1, 999).WithMessage("Quantity must be between 1 and 999.");
    }
}
