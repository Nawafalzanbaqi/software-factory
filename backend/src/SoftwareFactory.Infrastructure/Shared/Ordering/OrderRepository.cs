using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Domain.Shared.Ordering;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Shared.Ordering;

public sealed class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;

    public OrderRepository(AppDbContext db) => _db = db;

    public Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default) =>
        _db.Orders
            .Include(o => o.Items)
            .Include(o => o.Timeline)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, cancellationToken);

    public async Task<PagedResult<Order>> GetForUserAsync(string userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var baseQuery = _db.Orders.Where(o => o.UserId == userId);
        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .Include(o => o.Items)
            .Include(o => o.Timeline)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new PagedResult<Order>(items, page, pageSize, total);
    }

    public Task<bool> OrderNumberExistsAsync(string orderNumber, CancellationToken cancellationToken = default) =>
        _db.Orders.AnyAsync(o => o.OrderNumber == orderNumber, cancellationToken);

    public async Task AddAsync(Order order, CancellationToken cancellationToken = default) =>
        await _db.Orders.AddAsync(order, cancellationToken);
}
