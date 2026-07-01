using FluentValidation;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProductBySlug;

public sealed class GetProductBySlugQueryValidator : AbstractValidator<GetProductBySlugQuery>
{
    public GetProductBySlugQueryValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(200);
    }
}
