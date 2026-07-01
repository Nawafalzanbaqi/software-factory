using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProducts;

/// <summary>
/// GET /api/v1/products?category=&amp;search=&amp;page=&amp;pageSize=&amp;sort=
/// Paged, filterable, sortable product listing.
/// </summary>
public sealed record GetProductsQuery(
    string? Category = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 20,
    string? Sort = null) : IRequest<PagedResult<ProductDto>>;
