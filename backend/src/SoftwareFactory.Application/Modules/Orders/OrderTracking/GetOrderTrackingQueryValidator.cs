using FluentValidation;

namespace SoftwareFactory.Application.Modules.Orders.OrderTracking;

public sealed class GetOrderTrackingQueryValidator : AbstractValidator<GetOrderTrackingQuery>
{
    public GetOrderTrackingQueryValidator()
    {
        RuleFor(x => x.OrderNumber).NotEmpty().MaximumLength(50);
    }
}
