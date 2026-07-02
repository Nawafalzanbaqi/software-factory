using SoftwareFactory.Domain.Common;
using SoftwareFactory.Domain.Modules.Restaurant.ValueObjects;

namespace SoftwareFactory.Domain.Modules.Restaurant;

/// <summary>
/// A restaurant location. Bilingual address, geo point (for the locator map),
/// contact phone and human-readable opening hours. Owns its bookable tables.
/// </summary>
public class Branch : AggregateRoot
{
    public string Slug { get; private set; } = string.Empty;
    public string NameEn { get; private set; } = string.Empty;
    public string NameAr { get; private set; } = string.Empty;
    public string AddressEn { get; private set; } = string.Empty;
    public string AddressAr { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string OpeningHours { get; private set; } = string.Empty;

    public GeoLocation Location { get; private set; } = new(0, 0);

    private readonly List<Table> _tables = new();
    public IReadOnlyCollection<Table> Tables => _tables.AsReadOnly();

    private Branch() { }

    public Branch(
        string slug,
        string nameEn,
        string nameAr,
        string addressEn,
        string addressAr,
        string city,
        GeoLocation location,
        string phone,
        string openingHours)
    {
        Id = Guid.NewGuid();
        Slug = slug;
        NameEn = nameEn;
        NameAr = nameAr;
        AddressEn = addressEn;
        AddressAr = addressAr;
        City = city;
        Location = location;
        Phone = phone;
        OpeningHours = openingHours;
    }

    public Table AddTable(string name, int seats)
    {
        var table = new Table(Id, name, seats);
        _tables.Add(table);
        Touch();
        return table;
    }
}
