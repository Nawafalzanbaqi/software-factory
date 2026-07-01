using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Reviews;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("reviews");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ProductId);
        builder.HasIndex(r => r.ProductId);
        builder.Property(r => r.Author).HasMaxLength(120).IsRequired();
        builder.Property(r => r.Rating);
        builder.Property(r => r.Title).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Body).HasMaxLength(4000).IsRequired();
        builder.Property(r => r.CreatedAtUtc);
        builder.Property(r => r.UpdatedAtUtc);

        builder.Ignore(r => r.DomainEvents);
    }
}
