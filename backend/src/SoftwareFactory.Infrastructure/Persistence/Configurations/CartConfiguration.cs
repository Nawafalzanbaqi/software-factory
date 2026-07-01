using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Cart;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.ToTable("carts");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.UserId).HasMaxLength(200);
        builder.Property(c => c.Currency).HasMaxLength(3).IsRequired();
        builder.Property(c => c.CreatedAtUtc);
        builder.Property(c => c.UpdatedAtUtc);

        builder.HasMany(c => c.Items)
            .WithOne()
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Metadata.FindNavigation(nameof(Cart.Items))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(c => c.Subtotal);
        builder.Ignore(c => c.DomainEvents);
    }
}
