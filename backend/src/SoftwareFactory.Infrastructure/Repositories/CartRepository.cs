using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Modules.Cart;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Repositories;

public sealed class CartRepository : ICartRepository
{
    private readonly AppDbContext _db;

    public CartRepository(AppDbContext db) => _db = db;

    public Task<Domain.Modules.Cart.Cart?> GetByIdAsync(Guid cartId, CancellationToken cancellationToken = default) =>
        _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == cartId, cancellationToken);

    public async Task AddAsync(Domain.Modules.Cart.Cart cart, CancellationToken cancellationToken = default) =>
        await _db.Carts.AddAsync(cart, cancellationToken);

    public void Remove(Domain.Modules.Cart.Cart cart) => _db.Carts.Remove(cart);
}
