using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Infrastructure.Persistence;
using DomainCart = SoftwareFactory.Domain.Shared.Ordering.Cart;

namespace SoftwareFactory.Infrastructure.Shared.Ordering;

public sealed class CartRepository : ICartRepository
{
    private readonly AppDbContext _db;

    public CartRepository(AppDbContext db) => _db = db;

    public Task<DomainCart?> GetByIdAsync(Guid cartId, CancellationToken cancellationToken = default) =>
        _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == cartId, cancellationToken);

    public async Task AddAsync(DomainCart cart, CancellationToken cancellationToken = default) =>
        await _db.Carts.AddAsync(cart, cancellationToken);

    public void Remove(DomainCart cart) => _db.Carts.Remove(cart);
}
