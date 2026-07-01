using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Reviews;

/// <summary>
/// A product review. Feature-flagged (features.reviews, OFF by default).
/// </summary>
public class Review : AggregateRoot
{
    public Guid ProductId { get; private set; }
    public string Author { get; private set; } = string.Empty;
    public int Rating { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;

    private Review() { }

    public Review(Guid productId, string author, int rating, string title, string body)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        Author = author;
        Rating = Math.Clamp(rating, 1, 5);
        Title = title;
        Body = body;
    }
}
