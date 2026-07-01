using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Modules.Catalog.Products.Dtos;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProductBySlug;

public sealed class GetProductBySlugQueryHandler
    : IRequestHandler<GetProductBySlugQuery, ProductDto>
{
    private readonly IProductRepository _repository;

    public GetProductBySlugQueryHandler(IProductRepository repository) => _repository = repository;

    public async Task<ProductDto> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var product = await _repository.GetBySlugAsync(request.Slug, cancellationToken)
                      ?? throw new NotFoundException("Product", request.Slug);

        return product.ToDto();
    }
}
