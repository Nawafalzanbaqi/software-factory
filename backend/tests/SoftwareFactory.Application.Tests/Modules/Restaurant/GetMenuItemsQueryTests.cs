using NSubstitute;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Restaurant;
using SoftwareFactory.Application.Modules.Restaurant.Menu.Queries;
using SoftwareFactory.Domain.Modules.Restaurant;
using SoftwareFactory.Domain.ValueObjects;
using Xunit;

namespace SoftwareFactory.Application.Tests.Modules.Restaurant;

public class GetMenuItemsQueryTests
{
    private readonly IMenuItemRepository _repository = Substitute.For<IMenuItemRepository>();

    private static MenuItem SampleItem(string slug, decimal price) =>
        new(slug, $"{slug}-en", $"{slug}-ar", "desc-en", "desc-ar",
            new Money(price, "SAR"), Guid.NewGuid(), isAvailable: true, spicyLevel: 1, calories: 200);

    [Fact]
    public async Task Handle_maps_items_and_preserves_paging()
    {
        var items = new List<MenuItem> { SampleItem("hummus", 22m), SampleItem("kunafa", 28m) };
        _repository
            .SearchAsync(null, null, null, 1, 20, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<MenuItem>(items, 1, 20, 2));

        var handler = new GetMenuItemsQueryHandler(_repository);

        var result = await handler.Handle(new GetMenuItemsQuery(), CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Collection(result.Items,
            i => Assert.Equal("hummus", i.Slug),
            i => Assert.Equal("kunafa", i.Slug));
        Assert.Equal("SAR", result.Items[0].Currency);
        Assert.True(result.Items[0].IsAvailable);
    }

    [Fact]
    public async Task Handle_forwards_filter_and_sort_arguments()
    {
        _repository
            .SearchAsync("mains", "pizza", "price_desc", 2, 10, Arg.Any<CancellationToken>())
            .Returns(PagedResult<MenuItem>.Empty(2, 10));

        var handler = new GetMenuItemsQueryHandler(_repository);

        await handler.Handle(new GetMenuItemsQuery("mains", "pizza", 2, 10, "price_desc"), CancellationToken.None);

        await _repository.Received(1)
            .SearchAsync("mains", "pizza", "price_desc", 2, 10, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0, 20, false)]   // page < 1
    [InlineData(1, 0, false)]    // pageSize < 1
    [InlineData(1, 200, false)]  // pageSize > 100
    [InlineData(1, 20, true)]    // valid
    public void Validator_enforces_paging_bounds(int page, int pageSize, bool expectedValid)
    {
        var validator = new GetMenuItemsQueryValidator();
        var result = validator.Validate(new GetMenuItemsQuery(Page: page, PageSize: pageSize));
        Assert.Equal(expectedValid, result.IsValid);
    }

    [Theory]
    [InlineData("price_asc", true)]
    [InlineData("name_desc", true)]
    [InlineData("bogus", false)]
    public void Validator_enforces_allowed_sorts(string sort, bool expectedValid)
    {
        var validator = new GetMenuItemsQueryValidator();
        var result = validator.Validate(new GetMenuItemsQuery(Sort: sort));
        Assert.Equal(expectedValid, result.IsValid);
    }
}
