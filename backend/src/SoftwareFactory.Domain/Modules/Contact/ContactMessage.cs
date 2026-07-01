using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Contact;

/// <summary>
/// A submitted contact form message.
/// </summary>
public class ContactMessage : AggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public bool IsHandled { get; private set; }

    private ContactMessage() { }

    public ContactMessage(string name, string email, string message)
    {
        Id = Guid.NewGuid();
        Name = name;
        Email = email;
        Message = message;
    }
}
