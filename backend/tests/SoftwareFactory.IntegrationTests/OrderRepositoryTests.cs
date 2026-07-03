using SoftwareFactory.Domain.Shared.Ordering;
using SoftwareFactory.Domain.ValueObjects;
using SoftwareFactory.Infrastructure.Shared.Ordering;
using Xunit;

namespace SoftwareFactory.IntegrationTests;

/// <summary>
/// Exercises <see cref="OrderRepository"/> against a real Postgres instance
/// (Testcontainers). Pins the Phase 4 status-transition write path: appending
/// a timeline entry to an already-tracked order must INSERT — EF graph
/// discovery alone misreads the appended child as an update (the
/// dashboard-real E2E caught this as a DbUpdateConcurrencyException).
/// </summary>
[Collection("postgres")]
public class OrderRepositoryTests : IClassFixture<PostgresFixture>
{
    private readonly PostgresFixture _fixture;

    public OrderRepositoryTests(PostgresFixture fixture) => _fixture = fixture;

    private static Order PlaceSampleOrder(string orderNumber) =>
        Order.Place(
            orderNumber, "Jane Doe", "jane@example.com", "+966500000000", "cod", "SAR",
            new[] { new OrderItem(Guid.NewGuid(), "Item EN", "Item AR", new Money(45m, "SAR"), 1, "slug") },
            shippingAddress: new ShippingAddress("1 Test Street", "Riyadh", "SA"));

    [Fact]
    public async Task TransitionTo_persists_appended_timeline_entry_and_status()
    {
        var orderNumber = $"ORD-IT-{Guid.NewGuid():N}";

        // Place through one context (the checkout path).
        await using (var setup = _fixture.CreateContext())
        {
            var repo = new OrderRepository(setup);
            await repo.AddAsync(PlaceSampleOrder(orderNumber));
            await setup.SaveChangesAsync();
        }

        // Transition through a FRESH context (the dashboard manage path).
        await using (var db = _fixture.CreateContext())
        {
            var repo = new OrderRepository(db);
            var order = await repo.GetByOrderNumberAsync(orderNumber);
            Assert.NotNull(order);

            order!.TransitionTo(OrderStatus.Processing);
            repo.TrackTimelineAppends(order);
            await db.SaveChangesAsync();
        }

        // A third context proves the write really landed.
        await using (var verify = _fixture.CreateContext())
        {
            var repo = new OrderRepository(verify);
            var reloaded = await repo.GetByOrderNumberAsync(orderNumber);

            Assert.NotNull(reloaded);
            Assert.Equal(OrderStatus.Processing, reloaded!.Status);
            Assert.Equal(2, reloaded.Timeline.Count);
            Assert.Equal(OrderStatus.Processing, reloaded.Timeline.OrderBy(t => t.At).Last().Status);
        }
    }

    [Fact]
    public async Task GetPagedAsync_returns_newest_first_and_filters_by_status()
    {
        var first = $"ORD-IT-{Guid.NewGuid():N}";
        var second = $"ORD-IT-{Guid.NewGuid():N}";

        await using (var setup = _fixture.CreateContext())
        {
            var repo = new OrderRepository(setup);
            await repo.AddAsync(PlaceSampleOrder(first));
            await repo.AddAsync(PlaceSampleOrder(second));
            await setup.SaveChangesAsync();
        }

        await using var db = _fixture.CreateContext();
        var orders = new OrderRepository(db);

        var page = await orders.GetPagedAsync(1, 50);
        var numbers = page.Items.Select(o => o.OrderNumber).ToList();
        Assert.Contains(first, numbers);
        Assert.Contains(second, numbers);
        // Newest first: the later insert precedes the earlier one.
        Assert.True(numbers.IndexOf(second) < numbers.IndexOf(first));

        var none = await orders.GetPagedAsync(1, 50, OrderStatus.Delivered);
        Assert.DoesNotContain(none.Items, o => o.OrderNumber == first || o.OrderNumber == second);
    }
}
