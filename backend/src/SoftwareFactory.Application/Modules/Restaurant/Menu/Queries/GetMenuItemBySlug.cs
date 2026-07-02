using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Modules.Restaurant.Menu.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Menu.Queries;

/// <summary>
/// GET /api/v1/menu/items/{slug} — menu item detail (hot read, cached in Redis).
/// </summary>
public sealed record GetMenuItemBySlugQuery(string Slug)
    : IRequest<MenuItemDto>, ICacheableQuery
{
    public string CacheKey => $"menu-item:slug:{Slug}";

    public TimeSpan? Ttl => TimeSpan.FromMinutes(10);
}

public sealed class GetMenuItemBySlugQueryHandler
    : IRequestHandler<GetMenuItemBySlugQuery, MenuItemDto>
{
    private readonly IMenuItemRepository _items;

    public GetMenuItemBySlugQueryHandler(IMenuItemRepository items) => _items = items;

    public async Task<MenuItemDto> Handle(GetMenuItemBySlugQuery request, CancellationToken cancellationToken)
    {
        var item = await _items.GetBySlugAsync(request.Slug, cancellationToken)
                   ?? throw new NotFoundException("MenuItem", request.Slug);

        return item.ToDto();
    }
}

public sealed class GetMenuItemBySlugQueryValidator : AbstractValidator<GetMenuItemBySlugQuery>
{
    public GetMenuItemBySlugQueryValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().WithMessage("Slug is required.").MaximumLength(200);
    }
}
