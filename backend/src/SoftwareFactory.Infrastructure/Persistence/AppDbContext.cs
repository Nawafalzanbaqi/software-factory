using System.Reflection;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Common.Events;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.Modules.Cart;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Domain.Modules.Contact;
using SoftwareFactory.Domain.Modules.Orders;
using SoftwareFactory.Domain.Modules.Reviews;
using SoftwareFactory.Domain.Modules.Wishlist;

namespace SoftwareFactory.Infrastructure.Persistence;

/// <summary>
/// EF Core (Npgsql) DbContext. Acts as the unit of work and dispatches
/// aggregate domain events to MediatR after a successful save.
/// </summary>
public sealed class AppDbContext : DbContext, IUnitOfWork
{
    private readonly IPublisher? _publisher;

    public AppDbContext(DbContextOptions<AppDbContext> options, IPublisher? publisher = null)
        : base(options)
    {
        _publisher = publisher;
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var result = await base.SaveChangesAsync(cancellationToken);
        await DispatchDomainEventsAsync(cancellationToken);
        return result;
    }

    private async Task DispatchDomainEventsAsync(CancellationToken cancellationToken)
    {
        if (_publisher is null)
        {
            return;
        }

        var aggregates = ChangeTracker
            .Entries<AggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var events = aggregates.SelectMany(a => a.DomainEvents).ToList();
        aggregates.ForEach(a => a.ClearDomainEvents());

        foreach (var domainEvent in events)
        {
            // Wrap the dependency-free domain event in a MediatR notification.
            var notificationType = typeof(DomainEventNotification<>).MakeGenericType(domainEvent.GetType());
            var notification = Activator.CreateInstance(notificationType, domainEvent);
            if (notification is INotification n)
            {
                await _publisher.Publish(n, cancellationToken);
            }
        }
    }
}
