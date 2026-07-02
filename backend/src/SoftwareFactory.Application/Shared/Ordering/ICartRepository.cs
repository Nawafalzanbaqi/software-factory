using DomainCart = SoftwareFactory.Domain.Shared.Ordering.Cart;

namespace SoftwareFactory.Application.Shared.Ordering;

/// <summary>
/// Persistence abstraction for the Cart aggregate (with its items). Shared by
/// both verticals.
/// </summary>
public interface ICartRepository
{
    Task<DomainCart?> GetByIdAsync(Guid cartId, CancellationToken cancellationToken = default);

    Task AddAsync(DomainCart cart, CancellationToken cancellationToken = default);

    void Remove(DomainCart cart);
}
