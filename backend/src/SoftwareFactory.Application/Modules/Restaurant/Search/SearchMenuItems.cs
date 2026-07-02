using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Menu.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Search;

/// <summary>
/// GET /api/v1/search?q=  (restaurant vertical). Returns matching menu items.
/// </summary>
public sealed record SearchMenuItemsQuery(string Q, int Limit = 20)
    : IRequest<IReadOnlyList<MenuItemDto>>;

public sealed class SearchMenuItemsQueryHandler
    : IRequestHandler<SearchMenuItemsQuery, IReadOnlyList<MenuItemDto>>
{
    private readonly IMenuItemRepository _items;

    public SearchMenuItemsQueryHandler(IMenuItemRepository items) => _items = items;

    public async Task<IReadOnlyList<MenuItemDto>> Handle(SearchMenuItemsQuery request, CancellationToken cancellationToken)
    {
        var results = await _items.FullTextSearchAsync(request.Q, request.Limit, cancellationToken);
        return results.Select(i => i.ToDto()).ToList();
    }
}

public sealed class SearchMenuItemsQueryValidator : AbstractValidator<SearchMenuItemsQuery>
{
    public SearchMenuItemsQueryValidator()
    {
        RuleFor(x => x.Limit).InclusiveBetween(1, 100);
    }
}
