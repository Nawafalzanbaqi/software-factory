using SoftwareFactory.Domain.Modules.Cart;

namespace SoftwareFactory.Application.Modules.Cart.Dtos;

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
    public static CartDto ToDto(this Domain.Modules.Cart.Cart cart) => new(
        cart.Id,
        cart.Items.Select(i => new CartItemDto(
            i.Id,
            i.ProductId,
            i.ProductSlug,
            i.ProductNameEn,
            i.ProductNameAr,
            i.UnitPrice.Amount,
            i.Quantity,
            i.ImageUrl,
            i.LineTotal.Amount)).ToList(),
        cart.Subtotal.Amount,
        cart.Currency);
}
