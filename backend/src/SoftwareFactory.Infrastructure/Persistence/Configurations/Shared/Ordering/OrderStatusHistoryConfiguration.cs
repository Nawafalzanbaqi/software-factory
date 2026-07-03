using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Shared.Ordering;

public sealed class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistoryEntry>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistoryEntry> builder)
    {
        builder.ToTable("order_status_history");
        builder.HasKey(e => e.Id);
        // Client-side Guid generation on add: timeline entries appended to a
        // tracked Order (status transitions) must be discovered as INSERTs,
        // which requires the key to stay empty until EF assigns it. No schema
        // change — the value is still generated in the app, not the database.
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.OrderId);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(e => e.At);
        builder.HasIndex(e => e.OrderId);
    }
}
