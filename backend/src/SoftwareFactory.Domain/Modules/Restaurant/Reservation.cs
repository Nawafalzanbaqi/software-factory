using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Restaurant;

/// <summary>
/// A table reservation at a branch. Identified externally by a human-friendly
/// <see cref="Reference"/> used for tracking (analogous to an order number).
/// </summary>
public class Reservation : AggregateRoot
{
    public string Reference { get; private set; } = string.Empty;
    public Guid BranchId { get; private set; }
    public Guid? TableId { get; private set; }

    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerEmail { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;

    public int PartySize { get; private set; }
    public DateTimeOffset DateTime { get; private set; }
    public string? Notes { get; private set; }

    public ReservationStatus Status { get; private set; } = ReservationStatus.Pending;

    private Reservation() { }

    public Reservation(
        string reference,
        Guid branchId,
        string customerName,
        string customerEmail,
        string customerPhone,
        int partySize,
        DateTimeOffset dateTime,
        Guid? tableId = null,
        string? notes = null)
    {
        Id = Guid.NewGuid();
        Reference = reference;
        BranchId = branchId;
        CustomerName = customerName;
        CustomerEmail = customerEmail;
        CustomerPhone = customerPhone;
        PartySize = partySize < 1 ? 1 : partySize;
        DateTime = dateTime;
        TableId = tableId;
        Notes = notes;
        Status = ReservationStatus.Pending;
    }

    public void TransitionTo(ReservationStatus status)
    {
        Status = status;
        Touch();
    }
}
