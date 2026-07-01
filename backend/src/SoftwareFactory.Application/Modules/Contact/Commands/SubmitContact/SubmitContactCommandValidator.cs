using FluentValidation;

namespace SoftwareFactory.Application.Modules.Contact.Commands.SubmitContact;

public sealed class SubmitContactCommandValidator : AbstractValidator<SubmitContactCommand>
{
    public SubmitContactCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(5000);
    }
}
