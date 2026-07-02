using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Restaurant;

public sealed class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Slug).HasMaxLength(200).IsRequired();
        builder.HasIndex(b => b.Slug).IsUnique();

        builder.Property(b => b.NameEn).HasMaxLength(300).IsRequired();
        builder.Property(b => b.NameAr).HasMaxLength(300).IsRequired();
        builder.Property(b => b.AddressEn).HasMaxLength(500).IsRequired();
        builder.Property(b => b.AddressAr).HasMaxLength(500).IsRequired();
        builder.Property(b => b.City).HasMaxLength(120).IsRequired();
        builder.Property(b => b.Phone).HasMaxLength(30).IsRequired();
        builder.Property(b => b.OpeningHours).HasMaxLength(500).IsRequired();
        builder.Property(b => b.CreatedAtUtc);
        builder.Property(b => b.UpdatedAtUtc);

        // GeoLocation value object -> owned columns.
        builder.OwnsOne(b => b.Location, l =>
        {
            l.Property(x => x.Latitude).HasColumnName("latitude").IsRequired();
            l.Property(x => x.Longitude).HasColumnName("longitude").IsRequired();
        });
        builder.Navigation(b => b.Location).IsRequired();

        builder.HasMany(b => b.Tables)
            .WithOne()
            .HasForeignKey(t => t.BranchId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Metadata.FindNavigation(nameof(Branch.Tables))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(b => b.DomainEvents);
    }
}
