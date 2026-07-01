using SoftwareFactory.Domain.Modules.Reviews;

namespace SoftwareFactory.Application.Modules.Reviews;

/// <summary>
/// Persistence abstraction for product reviews (feature-flagged).
/// </summary>
public interface IReviewRepository
{
    Task<IReadOnlyList<Review>> GetForProductAsync(Guid productId, CancellationToken cancellationToken = default);

    Task<double?> GetAverageRatingAsync(Guid productId, CancellationToken cancellationToken = default);

    Task AddAsync(Review review, CancellationToken cancellationToken = default);
}
