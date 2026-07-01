using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Wishlist;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("wishlist_items");
        builder.HasKey(w => w.Id);

        builder.Property(w => w.UserId).HasMaxLength(200).IsRequired();
        builder.Property(w => w.ProductId);

        // A product can appear at most once per user.
        builder.HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();
    }
}
