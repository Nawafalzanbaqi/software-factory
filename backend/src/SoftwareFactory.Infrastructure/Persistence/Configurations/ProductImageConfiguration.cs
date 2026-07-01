using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Catalog;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("product_images");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Url).HasMaxLength(1000).IsRequired();
        builder.Property(i => i.AltText).HasMaxLength(300);
        builder.Property(i => i.SortOrder);
        builder.Property(i => i.ProductId);
        builder.HasIndex(i => i.ProductId);
    }
}
