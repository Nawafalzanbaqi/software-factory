using SoftwareFactory.Domain.Modules.Reviews;

namespace SoftwareFactory.Application.Modules.Reviews.Dtos;

/// <summary>Review DTO — shape shared with the frontend types.</summary>
public sealed record ReviewDto(
    Guid Id,
    Guid ProductId,
    string Author,
    int Rating,
    string Title,
    string Body,
    DateTimeOffset CreatedAt);

public static class ReviewMapping
{
    public static ReviewDto ToDto(this Review r) =>
        new(r.Id, r.ProductId, r.Author, r.Rating, r.Title, r.Body, r.CreatedAtUtc);
}
