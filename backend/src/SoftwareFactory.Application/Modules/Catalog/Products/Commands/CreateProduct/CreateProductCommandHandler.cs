using MediatR;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Domain.ValueObjects;

namespace SoftwareFactory.Application.Modules.Catalog.Products.Commands.CreateProduct;

public sealed class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly IProductRepository _products;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cache;

    public CreateProductCommandHandler(
        IProductRepository products,
        IUnitOfWork unitOfWork,
        ICacheService cache)
    {
        _products = products;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        if (await _products.SlugExistsAsync(request.Slug, cancellationToken))
        {
            throw new Common.Exceptions.ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(nameof(request.Slug), "A product with this slug already exists.")
            });
        }

        var product = new Product(
            request.Slug,
            request.NameEn,
            request.NameAr,
            request.DescriptionEn,
            request.DescriptionAr,
            new Money(request.Price, request.Currency),
            request.CategoryId,
            request.StockQuantity,
            request.CompareAtPrice);

        if (request.Images is not null)
        {
            var order = 0;
            foreach (var url in request.Images)
            {
                product.AddImage(new ProductImage(url, sortOrder: order++));
            }
        }

        if (request.Tags is not null)
        {
            foreach (var tag in request.Tags)
            {
                product.AddTag(tag);
            }
        }

        await _products.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Invalidate the detail cache for this slug (defensive; new item).
        await _cache.RemoveAsync($"product:slug:{product.Slug}", cancellationToken);

        return product.Id;
    }
}
