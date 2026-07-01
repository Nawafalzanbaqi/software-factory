using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProducts;

public sealed class GetProductsQueryHandler
    : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IProductRepository _repository;

    public GetProductsQueryHandler(IProductRepository repository) => _repository = repository;

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var page = await _repository.SearchAsync(
            request.Category,
            request.Search,
            request.Sort,
            request.Page,
            request.PageSize,
            cancellationToken);

        var items = page.Items.Select(p => p.ToDto()).ToList();

        return new PagedResult<ProductDto>(items, page.Page, page.PageSize, page.TotalCount);
    }
}
