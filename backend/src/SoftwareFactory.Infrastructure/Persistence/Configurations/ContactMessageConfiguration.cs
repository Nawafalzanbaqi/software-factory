using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Contact;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.ToTable("contact_messages");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name).HasMaxLength(200).IsRequired();
        builder.Property(m => m.Email).HasMaxLength(320).IsRequired();
        builder.Property(m => m.Message).HasMaxLength(5000).IsRequired();
        builder.Property(m => m.IsHandled);
        builder.Property(m => m.CreatedAtUtc);
        builder.Property(m => m.UpdatedAtUtc);

        builder.Ignore(m => m.DomainEvents);
    }
}
