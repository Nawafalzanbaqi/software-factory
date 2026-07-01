using FluentValidation;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Commands.CreateProduct;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(200)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug must be lowercase, alphanumeric and hyphen-separated.");

        RuleFor(x => x.NameEn).NotEmpty().MaximumLength(300);
        RuleFor(x => x.NameAr).NotEmpty().MaximumLength(300);
        RuleFor(x => x.DescriptionEn).NotEmpty();
        RuleFor(x => x.DescriptionAr).NotEmpty();

        RuleFor(x => x.Price).GreaterThan(0).WithMessage("Price must be greater than zero.");
        RuleFor(x => x.Currency).NotEmpty().Length(3).WithMessage("Currency must be a 3-letter ISO code.");
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("CategoryId is required.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);

        RuleFor(x => x.CompareAtPrice)
            .GreaterThan(x => x.Price)
            .When(x => x.CompareAtPrice.HasValue)
            .WithMessage("CompareAtPrice must be greater than Price when provided.");
    }
}
