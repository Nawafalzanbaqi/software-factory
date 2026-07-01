using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Wishlist;

/// <summary>
/// A product saved to a user's wishlist. Requires an authenticated user.
/// </summary>
public class WishlistItem : BaseEntity
{
    public string UserId { get; private set; } = string.Empty;
    public Guid ProductId { get; private set; }

    private WishlistItem() { }

    public WishlistItem(string userId, Guid productId)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        ProductId = productId;
    }
}
