using MediatR;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Search.Queries;

public sealed class SearchProductsQueryHandler
    : IRequestHandler<SearchProductsQuery, IReadOnlyList<ProductDto>>
{
    private readonly IProductRepository _products;

    public SearchProductsQueryHandler(IProductRepository products) => _products = products;

    public async Task<IReadOnlyList<ProductDto>> Handle(SearchProductsQuery request, CancellationToken cancellationToken)
    {
        var results = await _products.FullTextSearchAsync(request.Q, request.Limit, cancellationToken);
        return results.Select(p => p.ToDto()).ToList();
    }
}
