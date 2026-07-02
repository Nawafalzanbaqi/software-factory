using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Application.Modules.Restaurant;

/// <summary>Persistence abstraction for menu categories.</summary>
public interface IMenuCategoryRepository
{
    Task<IReadOnlyList<MenuCategory>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, int>> GetItemCountsAsync(CancellationToken cancellationToken = default);
}

/// <summary>Persistence abstraction for menu items.</summary>
public interface IMenuItemRepository
{
    Task<MenuItem?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<MenuItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>Filter (by category slug + search) / sort / page menu items.</summary>
    Task<PagedResult<MenuItem>> SearchAsync(
        string? categorySlug,
        string? search,
        string? sort,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MenuItem>> FullTextSearchAsync(string term, int limit, CancellationToken cancellationToken = default);

    Task AddAsync(MenuItem item, CancellationToken cancellationToken = default);
}

/// <summary>Persistence abstraction for branches (with their tables).</summary>
public interface IBranchRepository
{
    Task<IReadOnlyList<Branch>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Branch?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid branchId, CancellationToken cancellationToken = default);

    Task AddAsync(Branch branch, CancellationToken cancellationToken = default);
}

/// <summary>Persistence abstraction for reservations.</summary>
public interface IReservationRepository
{
    Task<Reservation?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default);

    Task<bool> ReferenceExistsAsync(string reference, CancellationToken cancellationToken = default);

    Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default);
}
