using MediatR;
using SoftwareFactory.Application.Modules.Reviews.Commands.CreateReview;
using SoftwareFactory.Application.Modules.Reviews.Queries.GetProductReviews;

namespace SoftwareFactory.Api.Modules.Reviews;

public sealed record CreateReviewRequest(
    Guid ProductId,
    string Author,
    int Rating,
    string Title,
    string Body);

/// <summary>
/// Reviews module — gated behind features.reviews (OFF by default).
/// </summary>
public static class ReviewsEndpoints
{
    public static IEndpointRouteBuilder MapReviews(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/reviews").WithTags("Reviews").RequireRateLimiting("public");

        group.MapGet("/{productId:guid}", async (Guid productId, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetProductReviewsQuery(productId), ct)))
            .WithName("GetProductReviews");

        group.MapPost("", async (CreateReviewRequest body, ISender sender, CancellationToken ct) =>
        {
            var id = await sender.Send(
                new CreateReviewCommand(body.ProductId, body.Author, body.Rating, body.Title, body.Body), ct);
            return Results.Created($"/api/v1/reviews/{body.ProductId}", new { id });
        })
            .WithName("CreateReview");

        return app;
    }
}
