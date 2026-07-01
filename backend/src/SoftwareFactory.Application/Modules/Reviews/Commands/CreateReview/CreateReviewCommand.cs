using MediatR;

namespace SoftwareFactory.Application.Modules.Reviews.Commands.CreateReview;

/// <summary>POST /api/v1/reviews  (feature: reviews).</summary>
public sealed record CreateReviewCommand(
    Guid ProductId,
    string Author,
    int Rating,
    string Title,
    string Body) : IRequest<Guid>;
