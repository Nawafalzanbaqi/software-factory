using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Modules.Restaurant;

/// <summary>
/// A physical table at a branch, bookable via a reservation.
/// </summary>
public class Table : BaseEntity
{
    public Guid BranchId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int Seats { get; private set; }
    public bool IsActive { get; private set; } = true;

    private Table() { }

    public Table(Guid branchId, string name, int seats, bool isActive = true)
    {
        Id = Guid.NewGuid();
        BranchId = branchId;
        Name = name;
        Seats = seats < 1 ? 1 : seats;
        IsActive = isActive;
    }
}
