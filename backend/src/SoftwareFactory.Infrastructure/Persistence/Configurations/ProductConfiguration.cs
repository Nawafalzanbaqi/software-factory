using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftwareFactory.Domain.Modules.Catalog;

namespace SoftwareFactory.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Slug).HasMaxLength(200).IsRequired();
        builder.HasIndex(p => p.Slug).IsUnique();

        builder.Property(p => p.NameEn).HasMaxLength(300).IsRequired();
        builder.Property(p => p.NameAr).HasMaxLength(300).IsRequired();
        builder.Property(p => p.DescriptionEn).IsRequired();
        builder.Property(p => p.DescriptionAr).IsRequired();

        builder.Property(p => p.CompareAtPrice).HasColumnType("numeric(18,2)");
        builder.Property(p => p.InStock);
        builder.Property(p => p.StockQuantity);
        builder.Property(p => p.Rating);
        builder.Property(p => p.CreatedAtUtc);
        builder.Property(p => p.UpdatedAtUtc);

        builder.Property(p => p.CategoryId);
        builder.HasIndex(p => p.CategoryId);

        // Money value object -> owned columns (price, currency).
        builder.OwnsOne(p => p.Price, m =>
        {
            m.Property(x => x.Amount).HasColumnName("price").HasColumnType("numeric(18,2)").IsRequired();
            m.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3).IsRequired();
        });
        builder.Navigation(p => p.Price).IsRequired();

        // Tags -> jsonb (serialized) via the backing field. A value comparer
        // ensures EF change-tracks the list by contents, not by reference.
        var tagsComparer = new ValueComparer<List<string>>(
            (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
            v => v == null ? 0 : v.Aggregate(0, (acc, s) => HashCode.Combine(acc, s.GetHashCode(StringComparison.Ordinal))),
            v => v == null ? new List<string>() : v.ToList());

        builder.Property<List<string>>("_tags")
            .HasColumnName("tags")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>(),
                tagsComparer);
        builder.Metadata.FindProperty("_tags")!.SetPropertyAccessMode(PropertyAccessMode.Field);

        // Images -> one-to-many, accessed through the aggregate's backing field.
        builder.HasMany(p => p.Images)
            .WithOne()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Metadata.FindNavigation(nameof(Product.Images))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(p => p.DomainEvents);
    }
}
