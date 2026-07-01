using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Domain.Modules.Orders;

namespace SoftwareFactory.Application.Modules.Orders;

/// <summary>
/// Persistence abstraction for the Order aggregate.
/// </summary>
public interface IOrderRepository
{
    Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);

    Task<PagedResult<Order>> GetForUserAsync(string userId, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<bool> OrderNumberExistsAsync(string orderNumber, CancellationToken cancellationToken = default);

    Task AddAsync(Order order, CancellationToken cancellationToken = default);
}
