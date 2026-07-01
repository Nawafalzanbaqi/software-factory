using FluentValidation;

namespace SoftwareFactory.Application.Modules.Wishlist.Commands.AddWishlistItem;

public sealed class AddWishlistItemCommandValidator : AbstractValidator<AddWishlistItemCommand>
{
    public AddWishlistItemCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("ProductId is required.");
    }
}
