namespace SoftwareFactory.Application.Modules.Cart;

/// <summary>
/// Persistence abstraction for the Cart aggregate (with its items).
/// </summary>
public interface ICartRepository
{
    Task<Domain.Modules.Cart.Cart?> GetByIdAsync(Guid cartId, CancellationToken cancellationToken = default);

    Task AddAsync(Domain.Modules.Cart.Cart cart, CancellationToken cancellationToken = default);

    void Remove(Domain.Modules.Cart.Cart cart);
}
