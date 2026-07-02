namespace SoftwareFactory.Domain.Modules.Restaurant;

/// <summary>Lifecycle status of a table reservation.</summary>
public enum ReservationStatus
{
    Pending = 0,
    Confirmed = 1,
    Seated = 2,
    Cancelled = 3,
    Completed = 4
}
