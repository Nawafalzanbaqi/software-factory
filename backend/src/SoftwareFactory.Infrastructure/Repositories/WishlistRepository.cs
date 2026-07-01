using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Modules.Wishlist;
using SoftwareFactory.Domain.Modules.Wishlist;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Repositories;

public sealed class WishlistRepository : IWishlistRepository
{
    private readonly AppDbContext _db;

    public WishlistRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<WishlistItem>> GetForUserAsync(string userId, CancellationToken cancellationToken = default) =>
        await _db.WishlistItems
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsAsync(string userId, Guid productId, CancellationToken cancellationToken = default) =>
        _db.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId, cancellationToken);

    public async Task AddAsync(WishlistItem item, CancellationToken cancellationToken = default) =>
        await _db.WishlistItems.AddAsync(item, cancellationToken);

    public async Task RemoveAsync(string userId, Guid productId, CancellationToken cancellationToken = default)
    {
        var item = await _db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId, cancellationToken);
        if (item is not null)
        {
            _db.WishlistItems.Remove(item);
        }
    }
}
