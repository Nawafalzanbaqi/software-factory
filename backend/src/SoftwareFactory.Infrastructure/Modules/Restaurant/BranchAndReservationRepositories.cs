using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Modules.Restaurant;
using SoftwareFactory.Domain.Modules.Restaurant;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Modules.Restaurant;

public sealed class BranchRepository : IBranchRepository
{
    private readonly AppDbContext _db;

    public BranchRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Branch>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _db.Branches.OrderBy(b => b.NameEn).ToListAsync(cancellationToken);

    public Task<Branch?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        _db.Branches.Include(b => b.Tables).FirstOrDefaultAsync(b => b.Slug == slug, cancellationToken);

    public Task<bool> ExistsAsync(Guid branchId, CancellationToken cancellationToken = default) =>
        _db.Branches.AnyAsync(b => b.Id == branchId, cancellationToken);

    public async Task AddAsync(Branch branch, CancellationToken cancellationToken = default) =>
        await _db.Branches.AddAsync(branch, cancellationToken);
}

public sealed class ReservationRepository : IReservationRepository
{
    private readonly AppDbContext _db;

    public ReservationRepository(AppDbContext db) => _db = db;

    public Task<Reservation?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default) =>
        _db.Reservations.FirstOrDefaultAsync(r => r.Reference == reference, cancellationToken);

    public Task<bool> ReferenceExistsAsync(string reference, CancellationToken cancellationToken = default) =>
        _db.Reservations.AnyAsync(r => r.Reference == reference, cancellationToken);

    public async Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default) =>
        await _db.Reservations.AddAsync(reservation, cancellationToken);
}
