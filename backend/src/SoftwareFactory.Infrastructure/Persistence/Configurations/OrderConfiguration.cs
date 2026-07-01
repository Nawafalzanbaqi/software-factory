using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Orders;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber).HasMaxLength(50).IsRequired();
        builder.HasIndex(o => o.OrderNumber).IsUnique();

        builder.Property(o => o.UserId).HasMaxLength(200);
        builder.HasIndex(o => o.UserId);

        builder.Property(o => o.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(o => o.CustomerEmail).HasMaxLength(320).IsRequired();
        builder.Property(o => o.CustomerPhone).HasMaxLength(30).IsRequired();
        builder.Property(o => o.ShippingAddress).HasMaxLength(500).IsRequired();
        builder.Property(o => o.PaymentMethod).HasMaxLength(30).IsRequired();
        builder.Property(o => o.Currency).HasMaxLength(3).IsRequired();
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(o => o.CreatedAtUtc);
        builder.Property(o => o.UpdatedAtUtc);

        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Metadata.FindNavigation(nameof(Order.Items))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(o => o.Timeline)
            .WithOne()
            .HasForeignKey(t => t.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Metadata.FindNavigation(nameof(Order.Timeline))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(o => o.Total);
        builder.Ignore(o => o.DomainEvents);
    }
}
