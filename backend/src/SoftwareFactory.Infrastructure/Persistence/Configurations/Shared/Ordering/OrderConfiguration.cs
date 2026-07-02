using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Shared.Ordering;

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
        builder.Property(o => o.PaymentMethod).HasMaxLength(30).IsRequired();
        builder.Property(o => o.Currency).HasMaxLength(3).IsRequired();
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(o => o.CreatedAtUtc);
        builder.Property(o => o.UpdatedAtUtc);

        // E-commerce shipping address — optional owned VO (nullable columns).
        builder.OwnsOne(o => o.ShippingAddress, sa =>
        {
            sa.Property(x => x.Line).HasColumnName("shipping_address_line").HasMaxLength(500);
            sa.Property(x => x.City).HasColumnName("shipping_address_city").HasMaxLength(120);
            sa.Property(x => x.Country).HasColumnName("shipping_address_country").HasMaxLength(120);
        });

        // Restaurant fulfillment — optional owned VO (nullable columns).
        builder.OwnsOne(o => o.Fulfillment, f =>
        {
            f.Property(x => x.Type).HasColumnName("fulfillment_type").HasConversion<string>().HasMaxLength(20);
            f.Property(x => x.BranchId).HasColumnName("fulfillment_branch_id");
            f.Property(x => x.TableId).HasColumnName("fulfillment_table_id");
            f.Property(x => x.ScheduledFor).HasColumnName("fulfillment_scheduled_for");
            f.Property(x => x.DeliveryAddress).HasColumnName("fulfillment_delivery_address").HasMaxLength(500);
        });

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
