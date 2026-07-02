using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Restaurant;

public sealed class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("reservations");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Reference).HasMaxLength(50).IsRequired();
        builder.HasIndex(r => r.Reference).IsUnique();

        builder.Property(r => r.BranchId);
        builder.HasIndex(r => r.BranchId);
        builder.Property(r => r.TableId);

        builder.Property(r => r.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(r => r.CustomerEmail).HasMaxLength(320).IsRequired();
        builder.Property(r => r.CustomerPhone).HasMaxLength(30).IsRequired();

        builder.Property(r => r.PartySize);
        builder.Property(r => r.DateTime);
        builder.Property(r => r.Notes).HasMaxLength(1000);
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(r => r.CreatedAtUtc);
        builder.Property(r => r.UpdatedAtUtc);

        builder.Ignore(r => r.DomainEvents);
    }
}
