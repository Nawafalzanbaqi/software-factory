using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Application.Modules.Restaurant.Reservations.Dtos;

/// <summary>Reservation DTO — returned when tracking a reservation (PHASE2.md §3).</summary>
public sealed record ReservationDto(
    string Reference,
    Guid BranchId,
    string Status,
    int PartySize,
    DateTimeOffset DateTime,
    string CustomerName,
    DateTimeOffset CreatedAt);

public static class ReservationMapping
{
    public static ReservationDto ToDto(this Reservation r) => new(
        r.Reference,
        r.BranchId,
        r.Status.ToString(),
        r.PartySize,
        r.DateTime,
        r.CustomerName,
        r.CreatedAtUtc);
}
