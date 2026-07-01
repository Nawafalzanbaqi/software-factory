using MediatR;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Search.Queries;

/// <summary>
/// GET /api/v1/search?q=  (feature: search). Returns matching products.
/// </summary>
public sealed record SearchProductsQuery(string Q, int Limit = 20)
    : IRequest<IReadOnlyList<ProductDto>>;
