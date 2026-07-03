using FluentValidation;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

public sealed class TransitionOrderStatusCommandValidator : AbstractValidator<TransitionOrderStatusCommand>
{
    public TransitionOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(ListAllOrdersQueryValidator.BeAKnownStatusName)
            .WithMessage($"Status must be one of: {string.Join(", ", Enum.GetNames<OrderStatus>())}.");
    }
}
