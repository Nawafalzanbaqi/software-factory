using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Catalog;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Slug).HasMaxLength(200).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique();

        builder.Property(c => c.NameEn).HasMaxLength(300).IsRequired();
        builder.Property(c => c.NameAr).HasMaxLength(300).IsRequired();
        builder.Property(c => c.ImageUrl).HasMaxLength(1000);
        builder.Property(c => c.CreatedAtUtc);
        builder.Property(c => c.UpdatedAtUtc);

        builder.Ignore(c => c.DomainEvents);
    }
}
