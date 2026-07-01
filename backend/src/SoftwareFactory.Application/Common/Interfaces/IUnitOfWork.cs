namespace SoftwareFactory.Application.Common.Interfaces;

/// <summary>
/// Commits the current unit of work. Implemented by the EF Core DbContext,
/// which also dispatches collected domain events after a successful save.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
