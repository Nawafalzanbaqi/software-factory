using SoftwareFactory.Application.Modules.Contact;
using SoftwareFactory.Domain.Modules.Contact;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Repositories;

public sealed class ContactMessageRepository : IContactMessageRepository
{
    private readonly AppDbContext _db;

    public ContactMessageRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(ContactMessage message, CancellationToken cancellationToken = default) =>
        await _db.ContactMessages.AddAsync(message, cancellationToken);
}
