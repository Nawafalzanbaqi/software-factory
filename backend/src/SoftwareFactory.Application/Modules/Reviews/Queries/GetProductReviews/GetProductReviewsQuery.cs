using MediatR;
using SoftwareFactory.Application.Modules.Reviews.Dtos;

namespace SoftwareFactory.Application.Modules.Reviews.Queries.GetProductReviews;

/// <summary>GET /api/v1/reviews/{productId}  (feature: reviews).</summary>
public sealed record GetProductReviewsQuery(Guid ProductId) : IRequest<IReadOnlyList<ReviewDto>>;
