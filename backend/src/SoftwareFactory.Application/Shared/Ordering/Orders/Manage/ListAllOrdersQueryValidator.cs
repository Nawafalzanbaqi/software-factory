using FluentValidation;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

public sealed class ListAllOrdersQueryValidator : AbstractValidator<ListAllOrdersQuery>
{
    public ListAllOrdersQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.Status)
            .Must(BeAKnownStatusName)
            .When(x => !string.IsNullOrWhiteSpace(x.Status))
            .WithMessage($"Status must be one of: {string.Join(", ", Enum.GetNames<OrderStatus>())}.");
    }

    /// <summary>Names only (case-insensitive) — numeric enum values are rejected.</summary>
    internal static bool BeAKnownStatusName(string? status) =>
        Enum.GetNames<OrderStatus>().Any(n => string.Equals(n, status, StringComparison.OrdinalIgnoreCase));
}
