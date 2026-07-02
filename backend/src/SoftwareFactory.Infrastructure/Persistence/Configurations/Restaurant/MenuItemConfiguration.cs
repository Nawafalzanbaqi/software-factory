using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations.Restaurant;

public sealed class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("menu_items");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Slug).HasMaxLength(200).IsRequired();
        builder.HasIndex(i => i.Slug).IsUnique();

        builder.Property(i => i.NameEn).HasMaxLength(300).IsRequired();
        builder.Property(i => i.NameAr).HasMaxLength(300).IsRequired();
        builder.Property(i => i.DescriptionEn).IsRequired();
        builder.Property(i => i.DescriptionAr).IsRequired();

        builder.Property(i => i.IsAvailable);
        builder.Property(i => i.SpicyLevel);
        builder.Property(i => i.Calories);
        builder.Property(i => i.CreatedAtUtc);
        builder.Property(i => i.UpdatedAtUtc);

        builder.Property(i => i.CategoryId);
        builder.HasIndex(i => i.CategoryId);

        builder.OwnsOne(i => i.Price, m =>
        {
            m.Property(x => x.Amount).HasColumnName("price").HasColumnType("numeric(18,2)").IsRequired();
            m.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3).IsRequired();
        });
        builder.Navigation(i => i.Price).IsRequired();

        ConfigureStringList(builder, "_images", "images");
        ConfigureStringList(builder, "_tags", "tags");

        builder.Ignore(i => i.DomainEvents);
    }

    private static void ConfigureStringList(EntityTypeBuilder<MenuItem> builder, string field, string column)
    {
        var comparer = new ValueComparer<List<string>>(
            (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
            v => v == null ? 0 : v.Aggregate(0, (acc, s) => HashCode.Combine(acc, s.GetHashCode(StringComparison.Ordinal))),
            v => v == null ? new List<string>() : v.ToList());

        builder.Property<List<string>>(field)
            .HasColumnName(column)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>(),
                comparer);
        builder.Metadata.FindProperty(field)!.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
