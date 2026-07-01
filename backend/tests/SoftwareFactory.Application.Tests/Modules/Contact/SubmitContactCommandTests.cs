using NSubstitute;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Contact;
using SoftwareFactory.Application.Modules.Contact.Commands.SubmitContact;
using SoftwareFactory.Domain.Modules.Contact;
using Xunit;

namespace SoftwareFactory.Application.Tests.Modules.Contact;

public class SubmitContactCommandTests
{
    private readonly IContactMessageRepository _repository = Substitute.For<IContactMessageRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task Handle_saves_contact_message()
    {
        var handler = new SubmitContactCommandHandler(_repository, _unitOfWork);
        var command = new SubmitContactCommand("Nawaf", "n@example.com", "Hello there");

        var id = await handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, id);
        await _repository.Received(1).AddAsync(
            Arg.Is<ContactMessage>(m => m.Email == "n@example.com" && m.Name == "Nawaf"),
            Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("", "n@example.com", "hi", false)]
    [InlineData("Nawaf", "not-an-email", "hi", false)]
    [InlineData("Nawaf", "n@example.com", "", false)]
    [InlineData("Nawaf", "n@example.com", "A real message", true)]
    public void Validator_enforces_rules(string name, string email, string message, bool expectedValid)
    {
        var result = new SubmitContactCommandValidator().Validate(new SubmitContactCommand(name, email, message));
        Assert.Equal(expectedValid, result.IsValid);
    }
}
