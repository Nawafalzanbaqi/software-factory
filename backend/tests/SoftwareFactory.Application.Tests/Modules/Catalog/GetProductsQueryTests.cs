using NSubstitute;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Modules.Catalog.Products.Queries.GetProducts;
using SoftwareFactory.Domain.Modules.Catalog;
using SoftwareFactory.Domain.ValueObjects;
using Xunit;

namespace SoftwareFactory.Application.Tests.Modules.Catalog;

public class GetProductsQueryTests
{
    private readonly IProductRepository _repository = Substitute.For<IProductRepository>();

    private static Product SampleProduct(string slug, decimal price) =>
        new(slug, $"{slug}-en", $"{slug}-ar", "desc-en", "desc-ar",
            new Money(price, "SAR"), Guid.NewGuid(), stockQuantity: 5);

    [Fact]
    public async Task Handle_maps_products_and_preserves_paging()
    {
        var products = new List<Product> { SampleProduct("a", 10m), SampleProduct("b", 20m) };
        _repository
            .SearchAsync(null, null, null, 1, 20, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<Product>(products, 1, 20, 2));

        var handler = new GetProductsQueryHandler(_repository);

        var result = await handler.Handle(new GetProductsQuery(), CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Collection(result.Items,
            p => Assert.Equal("a", p.Slug),
            p => Assert.Equal("b", p.Slug));
        Assert.Equal("SAR", result.Items[0].Currency);
    }

    [Fact]
    public async Task Handle_forwards_filter_and_sort_arguments()
    {
        _repository
            .SearchAsync("electronics", "phone", "price_desc", 2, 10, Arg.Any<CancellationToken>())
            .Returns(PagedResult<Product>.Empty(2, 10));

        var handler = new GetProductsQueryHandler(_repository);

        await handler.Handle(new GetProductsQuery("electronics", "phone", 2, 10, "price_desc"), CancellationToken.None);

        await _repository.Received(1)
            .SearchAsync("electronics", "phone", "price_desc", 2, 10, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0, 20, false)]   // page < 1
    [InlineData(1, 0, false)]    // pageSize < 1
    [InlineData(1, 200, false)]  // pageSize > 100
    [InlineData(1, 20, true)]    // valid
    public void Validator_enforces_paging_bounds(int page, int pageSize, bool expectedValid)
    {
        var validator = new GetProductsQueryValidator();
        var result = validator.Validate(new GetProductsQuery(Page: page, PageSize: pageSize));
        Assert.Equal(expectedValid, result.IsValid);
    }

    [Fact]
    public void Validator_rejects_unknown_sort()
    {
        var validator = new GetProductsQueryValidator();
        var result = validator.Validate(new GetProductsQuery(Sort: "bogus"));
        Assert.False(result.IsValid);
    }
}
