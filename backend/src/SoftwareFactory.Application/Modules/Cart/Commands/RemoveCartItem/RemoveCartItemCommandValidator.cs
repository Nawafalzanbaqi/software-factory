using FluentValidation;

namespace SoftwareFactory.Application.Modules.Cart.Commands.RemoveCartItem;

public sealed class RemoveCartItemCommandValidator : AbstractValidator<RemoveCartItemCommand>
{
    public RemoveCartItemCommandValidator()
    {
        RuleFor(x => x.CartId).NotEmpty();
        RuleFor(x => x.ItemId).NotEmpty();
    }
}
