using SoftwareFactory.Domain.Modules.Wishlist;

namespace SoftwareFactory.Application.Modules.Wishlist;

/// <summary>
/// Persistence abstraction for wishlist items (per authenticated user).
/// </summary>
public interface IWishlistRepository
{
    Task<IReadOnlyList<WishlistItem>> GetForUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(string userId, Guid productId, CancellationToken cancellationToken = default);

    Task AddAsync(WishlistItem item, CancellationToken cancellationToken = default);

    Task RemoveAsync(string userId, Guid productId, CancellationToken cancellationToken = default);
}
