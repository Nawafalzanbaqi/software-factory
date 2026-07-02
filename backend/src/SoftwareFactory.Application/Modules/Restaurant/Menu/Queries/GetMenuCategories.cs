using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Menu.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Menu.Queries;

/// <summary>GET /api/v1/menu/categories -> MenuCategoryDto[]</summary>
public sealed record GetMenuCategoriesQuery : IRequest<IReadOnlyList<MenuCategoryDto>>;

public sealed class GetMenuCategoriesQueryHandler
    : IRequestHandler<GetMenuCategoriesQuery, IReadOnlyList<MenuCategoryDto>>
{
    private readonly IMenuCategoryRepository _categories;

    public GetMenuCategoriesQueryHandler(IMenuCategoryRepository categories) => _categories = categories;

    public async Task<IReadOnlyList<MenuCategoryDto>> Handle(GetMenuCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _categories.GetAllAsync(cancellationToken);
        var counts = await _categories.GetItemCountsAsync(cancellationToken);

        return categories
            .Select(c => new MenuCategoryDto(
                c.Id,
                c.Slug,
                c.NameEn,
                c.NameAr,
                c.ImageUrl,
                counts.TryGetValue(c.Id, out var n) ? n : 0))
            .ToList();
    }
}
