using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Cart.Dtos;
using SoftwareFactory.Application.Modules.Catalog.Products;

namespace SoftwareFactory.Application.Modules.Cart.Commands.AddCartItem;

public sealed class AddCartItemCommandHandler : IRequestHandler<AddCartItemCommand, CartDto>
{
    private readonly ICartRepository _carts;
    private readonly IProductRepository _products;
    private readonly IUnitOfWork _unitOfWork;

    public AddCartItemCommandHandler(
        ICartRepository carts,
        IProductRepository products,
        IUnitOfWork unitOfWork)
    {
        _carts = carts;
        _products = products;
        _unitOfWork = unitOfWork;
    }

    public async Task<CartDto> Handle(AddCartItemCommand request, CancellationToken cancellationToken)
    {
        var product = await _products.GetByIdAsync(request.ProductId, cancellationToken)
                      ?? throw new NotFoundException("Product", request.ProductId);

        Domain.Modules.Cart.Cart? cart = null;
        if (request.CartId is { } cartId)
        {
            cart = await _carts.GetByIdAsync(cartId, cancellationToken);
        }

        if (cart is null)
        {
            cart = new Domain.Modules.Cart.Cart(product.Price.Currency);
            await _carts.AddAsync(cart, cancellationToken);
        }

        var imageUrl = product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault();

        cart.AddItem(
            product.Id,
            product.Slug,
            product.NameEn,
            product.NameAr,
            product.Price,
            request.Quantity,
            imageUrl);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return cart.ToDto();
    }
}
