using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Orders;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.OrderId);
        builder.Property(i => i.ProductId);
        builder.Property(i => i.ProductNameEn).HasMaxLength(300).IsRequired();
        builder.Property(i => i.ProductNameAr).HasMaxLength(300).IsRequired();
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
