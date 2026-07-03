using FluentValidation;

namespace SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

public sealed class GetManagedOrderQueryValidator : AbstractValidator<GetManagedOrderQuery>
{
    public GetManagedOrderQueryValidator()
    {
        RuleFor(x => x.OrderNumber).NotEmpty().MaximumLength(50);
    }
}
