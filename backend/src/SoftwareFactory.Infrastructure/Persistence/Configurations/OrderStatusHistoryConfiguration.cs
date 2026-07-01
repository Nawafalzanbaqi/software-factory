using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Orders;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistoryEntry>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistoryEntry> builder)
    {
        builder.ToTable("order_status_history");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.OrderId);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(e => e.At);
        builder.HasIndex(e => e.OrderId);
    }
}
