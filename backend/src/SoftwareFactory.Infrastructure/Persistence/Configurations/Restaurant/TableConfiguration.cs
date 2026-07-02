using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Restaurant;

public sealed class TableConfiguration : IEntityTypeConfiguration<Table>
{
    public void Configure(EntityTypeBuilder<Table> builder)
    {
        builder.ToTable("tables");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.BranchId);
        builder.HasIndex(t => t.BranchId);
        builder.Property(t => t.Name).HasMaxLength(100).IsRequired();
        builder.Property(t => t.Seats);
        builder.Property(t => t.IsActive);
        builder.Property(t => t.CreatedAtUtc);
        builder.Property(t => t.UpdatedAtUtc);
    }
}
