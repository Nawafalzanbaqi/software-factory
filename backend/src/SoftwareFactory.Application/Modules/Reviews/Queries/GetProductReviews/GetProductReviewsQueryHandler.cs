using MediatR;
using SoftwareFactory.Application.Modules.Reviews.Dtos;

namespace SoftwareFactory.Application.Modules.Reviews.Queries.GetProductReviews;

public sealed class GetProductReviewsQueryHandler
    : IRequestHandler<GetProductReviewsQuery, IReadOnlyList<ReviewDto>>
{
    private readonly IReviewRepository _reviews;

    public GetProductReviewsQueryHandler(IReviewRepository reviews) => _reviews = reviews;

    public async Task<IReadOnlyList<ReviewDto>> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
    {
        var reviews = await _reviews.GetForProductAsync(request.ProductId, cancellationToken);
        return reviews.Select(r => r.ToDto()).ToList();
    }
}
