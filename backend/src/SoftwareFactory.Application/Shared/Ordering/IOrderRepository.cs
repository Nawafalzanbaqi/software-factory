using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering;

/// <summary>
/// Persistence abstraction for the Order aggregate. Shared by both verticals.
/// </summary>
public interface IOrderRepository
{
    Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);

    Task<PagedResult<Order>> GetForUserAsync(string userId, int page, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>
    /// All orders in the store, newest first, optionally filtered by status.
    /// Added in Phase 4 for the client dashboard's staff order management.
    /// </summary>
    Task<PagedResult<Order>> GetPagedAsync(int page, int pageSize, OrderStatus? status = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Registers timeline entries appended to an already-loaded order (a
    /// status transition) as NEW rows. Persistence cannot infer this from the
    /// aggregate alone — change-tracker graph discovery treats a key-bearing
    /// child on a tracked parent as an existing row to update.
    /// Added in Phase 4 alongside the first order-update flow.
    /// </summary>
    void TrackTimelineAppends(Order order);

    Task<bool> OrderNumberExistsAsync(string orderNumber, CancellationToken cancellationToken = default);

    Task AddAsync(Order order, CancellationToken cancellationToken = default);
}
