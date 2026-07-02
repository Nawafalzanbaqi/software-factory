using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Shared.Ordering.Dtos;
using DomainCart = SoftwareFactory.Domain.Shared.Ordering.Cart;

namespace SoftwareFactory.Application.Shared.Ordering.Cart.Commands.AddCartItem;

public sealed class AddCartItemCommandHandler : IRequestHandler<AddCartItemCommand, CartDto>
{
    private readonly ICartRepository _carts;
    private readonly ICatalogItemLookup _catalog;
    private readonly IUnitOfWork _unitOfWork;

    public AddCartItemCommandHandler(
        ICartRepository carts,
        ICatalogItemLookup catalog,
        IUnitOfWork unitOfWork)
    {
        _carts = carts;
        _catalog = catalog;
        _unitOfWork = unitOfWork;
    }

    public async Task<CartDto> Handle(AddCartItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _catalog.FindAsync(request.ProductId, cancellationToken)
                   ?? throw new NotFoundException("CatalogItem", request.ProductId);

        DomainCart? cart = null;
        if (request.CartId is { } cartId)
        {
            cart = await _carts.GetByIdAsync(cartId, cancellationToken);
        }

        if (cart is null)
        {
            cart = new DomainCart(item.UnitPrice.Currency);
            await _carts.AddAsync(cart, cancellationToken);
        }

        cart.AddItem(
            item.ItemId,
            item.Slug,
            item.NameEn,
            item.NameAr,
            item.UnitPrice,
            request.Quantity,
            item.ImageUrl);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return cart.ToDto();
    }
}
