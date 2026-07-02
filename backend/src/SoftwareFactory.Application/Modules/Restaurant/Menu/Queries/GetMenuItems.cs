using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Restaurant.Menu.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Menu.Queries;

/// <summary>
/// GET /api/v1/menu/items?category=&amp;search=&amp;page=&amp;pageSize=&amp;sort=
/// Paged, filterable, sortable menu-item listing.
/// </summary>
public sealed record GetMenuItemsQuery(
    string? Category = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 20,
    string? Sort = null) : IRequest<PagedResult<MenuItemDto>>;

public sealed class GetMenuItemsQueryHandler
    : IRequestHandler<GetMenuItemsQuery, PagedResult<MenuItemDto>>
{
    private readonly IMenuItemRepository _items;

    public GetMenuItemsQueryHandler(IMenuItemRepository items) => _items = items;

    public async Task<PagedResult<MenuItemDto>> Handle(GetMenuItemsQuery request, CancellationToken cancellationToken)
    {
        var page = await _items.SearchAsync(
            request.Category,
            request.Search,
            request.Sort,
            request.Page,
            request.PageSize,
            cancellationToken);

        var items = page.Items.Select(i => i.ToDto()).ToList();

        return new PagedResult<MenuItemDto>(items, page.Page, page.PageSize, page.TotalCount);
    }
}

public sealed class GetMenuItemsQueryValidator : AbstractValidator<GetMenuItemsQuery>
{
    private static readonly string[] AllowedSorts =
        { "price_asc", "price_desc", "newest", "name_asc", "name_desc" };

    public GetMenuItemsQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1).WithMessage("Page must be >= 1.");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");
        RuleFor(x => x.Sort)
            .Must(s => string.IsNullOrWhiteSpace(s) || AllowedSorts.Contains(s))
            .WithMessage($"Sort must be one of: {string.Join(", ", AllowedSorts)}.");
        RuleFor(x => x.Search).MaximumLength(200).WithMessage("Search term is too long.");
    }
}
