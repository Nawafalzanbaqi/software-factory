using FluentValidation;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProducts;

public sealed class GetProductsQueryValidator : AbstractValidator<GetProductsQuery>
{
    private static readonly string[] AllowedSorts =
        { "price_asc", "price_desc", "newest", "rating", "name_asc", "name_desc" };

    public GetProductsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be >= 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x.Sort)
            .Must(s => string.IsNullOrWhiteSpace(s) || AllowedSorts.Contains(s))
            .WithMessage($"Sort must be one of: {string.Join(", ", AllowedSorts)}.");

        RuleFor(x => x.Search)
            .MaximumLength(200).WithMessage("Search term is too long.");
    }
}
