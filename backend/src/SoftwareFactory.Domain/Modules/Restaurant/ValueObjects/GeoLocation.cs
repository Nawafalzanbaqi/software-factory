using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Restaurant.ValueObjects;

/// <summary>
/// A geographic point (WGS84) for a branch — used to render the branch locator map.
/// </summary>
public sealed class GeoLocation : ValueObject
{
    public double Latitude { get; }
    public double Longitude { get; }

    public GeoLocation(double latitude, double longitude)
    {
        if (latitude is < -90 or > 90)
        {
            throw new ArgumentOutOfRangeException(nameof(latitude), "Latitude must be between -90 and 90.");
        }

        if (longitude is < -180 or > 180)
        {
            throw new ArgumentOutOfRangeException(nameof(longitude), "Longitude must be between -180 and 180.");
        }

        Latitude = latitude;
        Longitude = longitude;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Latitude;
        yield return Longitude;
    }
}
