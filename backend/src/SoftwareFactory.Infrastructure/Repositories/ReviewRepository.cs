using Microsoft.EntityFrameworkCore;
using SoftwareFactory.Application.Modules.Reviews;
using SoftwareFactory.Domain.Modules.Reviews;
using SoftwareFactory.Infrastructure.Persistence;

namespace SoftwareFactory.Infrastructure.Repositories;

public sealed class ReviewRepository : IReviewRepository
{
    private readonly AppDbContext _db;

    public ReviewRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Review>> GetForProductAsync(Guid productId, CancellationToken cancellationToken = default) =>
        await _db.Reviews
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task<double?> GetAverageRatingAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        var any = await _db.Reviews.AnyAsync(r => r.ProductId == productId, cancellationToken);
        if (!any)
        {
            return null;
        }

        return await _db.Reviews
            .Where(r => r.ProductId == productId)
            .AverageAsync(r => (double)r.Rating, cancellationToken);
    }

    public async Task AddAsync(Review review, CancellationToken cancellationToken = default) =>
        await _db.Reviews.AddAsync(review, cancellationToken);
}
