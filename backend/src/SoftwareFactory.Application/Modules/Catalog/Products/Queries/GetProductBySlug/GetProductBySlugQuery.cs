using MediatR;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProductBySlug;

/// <summary>
/// GET /api/v1/products/{slug} — product detail (hot read, cached in Redis).
/// </summary>
public sealed record GetProductBySlugQuery(string Slug)
    : IRequest<ProductDto>, ICacheableQuery
{
    public string CacheKey => $"product:slug:{Slug}";

    public TimeSpan? Ttl => TimeSpan.FromMinutes(10);
}
