using FluentValidation;

namespace SoftwareFactory.Application.Modules.Search.Queries;

public sealed class SearchProductsQueryValidator : AbstractValidator<SearchProductsQuery>
{
    public SearchProductsQueryValidator()
    {
        RuleFor(x => x.Q)
            .NotEmpty().WithMessage("Search term 'q' is required.")
            .MinimumLength(2).WithMessage("Search term must be at least 2 characters.")
            .MaximumLength(200);

        RuleFor(x => x.Limit).InclusiveBetween(1, 50);
    }
}
