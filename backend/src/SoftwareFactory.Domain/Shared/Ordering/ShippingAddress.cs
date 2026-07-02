using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>
/// Optional shipping address for an order (e-commerce fulfillment). Owned,
/// nullable value object — only set for shipped orders. Restaurant orders use
/// <see cref="Fulfillment"/> instead.
/// </summary>
public sealed class ShippingAddress : ValueObject
{
    public string Line { get; }
    public string? City { get; }
    public string? Country { get; }

    public ShippingAddress(string line, string? city = null, string? country = null)
    {
        Line = line ?? string.Empty;
        City = city;
        Country = country;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Line;
        yield return City;
        yield return Country;
    }

    public override string ToString() => Line;
}
