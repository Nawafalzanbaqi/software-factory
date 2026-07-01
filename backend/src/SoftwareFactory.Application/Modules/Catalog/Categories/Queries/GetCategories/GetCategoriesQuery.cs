using MediatR;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Modules.Catalog.Categories.Dtos;

namespace SoftwareFactory.Application.Modules.Catalog.Categories.Queries.GetCategories;

/// <summary>
/// GET /api/v1/categories — all categories with product counts (cached).
/// </summary>
public sealed record GetCategoriesQuery
    : IRequest<IReadOnlyList<CategoryDto>>, ICacheableQuery
{
    public string CacheKey => "categories:all";

    public TimeSpan? Ttl => TimeSpan.FromMinutes(15);
}
