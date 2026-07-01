using MediatR;
using SoftwareFactory.Application.Modules.Catalog.Categories.Dtos;

namespace SoftwareFactory.Application.Modules.Catalog.Categories.Queries.GetCategories;

public sealed class GetCategoriesQueryHandler
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly ICategoryRepository _repository;

    public GetCategoriesQueryHandler(ICategoryRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _repository.GetAllAsync(cancellationToken);
        var counts = await _repository.GetProductCountsAsync(cancellationToken);

        return categories
            .Select(c => new CategoryDto(
                c.Id,
                c.Slug,
                c.NameEn,
                c.NameAr,
                c.ImageUrl,
                counts.TryGetValue(c.Id, out var n) ? n : 0))
            .ToList();
    }
}
