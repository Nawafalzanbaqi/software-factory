using DomainCart = SoftwareFactory.Domain.Shared.Ordering.Cart;

namespace SoftwareFactory.Application.Shared.Ordering.Dtos;

/// <summary>
/// Cart line DTO. Wire-compat: the field stays named <c>ProductId</c> (the
/// generic catalog-item id — a Product id for e-commerce, a MenuItem id for
/// restaurant) so the Phase 1 REST contract stays byte-identical. The domain
/// property is <c>ItemId</c>.
/// </summary>
public sealed record CartItemDto(
    Guid Id,
    Guid ProductId,
    string Slug,
    string NameEn,
    string NameAr,
    decimal Price,
    int Quantity,
    string? ImageUrl,
    decimal LineTotal);

public sealed record CartDto(
    Guid Id,
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal,
    string Currency);

/// <summary>Maps the Cart aggregate to its DTO.</summary>
public static class CartMapping
{
    public static CartDto ToDto(this DomainCart cart) => new(
        cart.Id,
        cart.Items.Select(i => new CartItemDto(
            i.Id,
            i.ItemId,
            i.Slug,
            i.NameEn,
            i.NameAr,
            i.UnitPrice.Amount,
            i.Quantity,
            i.ImageUrl,
            i.LineTotal.Amount)).ToList(),
        cart.Subtotal.Amount,
        cart.Currency);
}
