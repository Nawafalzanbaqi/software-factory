using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Shared.Ordering;

public sealed class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("cart_items");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.CartId);
        builder.Property(i => i.ItemId);
        builder.Property(i => i.Slug).HasMaxLength(200).IsRequired();
        builder.Property(i => i.NameEn).HasMaxLength(300).IsRequired();
        builder.Property(i => i.NameAr).HasMaxLength(300).IsRequired();
        builder.Property(i => i.ImageUrl).HasMaxLength(1000);
        builder.Property(i => i.Quantity);

        builder.OwnsOne(i => i.UnitPrice, m =>
        {
            m.Property(x => x.Amount).HasColumnName("unit_price").HasColumnType("numeric(18,2)").IsRequired();
            m.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3).IsRequired();
        });
        builder.Navigation(i => i.UnitPrice).IsRequired();

        builder.Ignore(i => i.LineTotal);
    }
}
