using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// Shopping/basket cart aggregate. Generic across verticals (e-commerce products
/// and restaurant menu items alike). May be anonymous (session) or tied to a user.
/// </summary>
public class Cart : AggregateRoot
{
    public string? UserId { get; private set; }
    public string Currency { get; private set; } = "SAR";

    private readonly List<CartItem> _items = new();
    public IReadOnlyCollection<CartItem> Items => _items.AsReadOnly();

    public Money Subtotal
    {
        get
        {
            var total = Money.Zero(Currency);
            foreach (var item in _items)
            {
                total = total.Add(item.LineTotal);
            }

            return total;
        }
    }

    private Cart() { }

    public Cart(string currency = "SAR", string? userId = null)
    {
        Id = Guid.NewGuid();
        Currency = currency;
        UserId = userId;
    }

    public CartItem AddItem(
        Guid itemId,
        string slug,
        string nameEn,
        string nameAr,
        Money unitPrice,
        int quantity,
        string? imageUrl)
    {
        var existing = _items.FirstOrDefault(i => i.ItemId == itemId);
        if (existing is not null)
        {
            existing.Increase(quantity);
            Touch();
            return existing;
        }

        var item = new CartItem(itemId, slug, nameEn, nameAr, unitPrice, quantity, imageUrl);
        _items.Add(item);
        Touch();
        return item;
    }

    public void UpdateItemQuantity(Guid itemId, int quantity)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId)
                   ?? throw new InvalidOperationException($"Cart item {itemId} not found.");
        item.SetQuantity(quantity);
        Touch();
    }

    public void RemoveItem(Guid itemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item is not null)
        {
            _items.Remove(item);
            Touch();
        }
    }

    public void Clear()
    {
        _items.Clear();
        Touch();
    }
}
