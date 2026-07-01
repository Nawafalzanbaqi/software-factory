using SoftwareFactory.Domain.Modules.Contact;

namespace SoftwareFactory.Application.Modules.Contact;

/// <summary>Persistence abstraction for contact form submissions.</summary>
public interface IContactMessageRepository
{
    Task AddAsync(ContactMessage message, CancellationToken cancellationToken = default);
}
