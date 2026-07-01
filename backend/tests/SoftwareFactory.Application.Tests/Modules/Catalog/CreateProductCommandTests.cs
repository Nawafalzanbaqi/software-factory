using NSubstitute;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Application.Modules.Catalog.Products.Commands.CreateProduct;
using SoftwareFactory.Domain.Modules.Catalog;
using Xunit;
using ValidationException = SoftwareFactory.Application.Common.Exceptions.ValidationException;

namespace SoftwareFactory.Application.Tests.Modules.Catalog;

public class CreateProductCommandTests
{
    private readonly IProductRepository _products = Substitute.For<IProductRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICacheService _cache = Substitute.For<ICacheService>();

    private CreateProductCommandHandler CreateHandler() => new(_products, _unitOfWork, _cache);

    private static CreateProductCommand ValidCommand() => new(
        Slug: "new-product",
        NameEn: "New Product",
        NameAr: "منتج جديد",
        DescriptionEn: "A description.",
        DescriptionAr: "وصف.",
        Price: 100m,
        Currency: "SAR",
        CategoryId: Guid.NewGuid(),
        StockQuantity: 10,
        CompareAtPrice: 150m,
        Images: new[] { "https://img/1.jpg" },
        Tags: new[] { "tag1" });

    [Fact]
    public async Task Handle_persists_product_and_saves()
    {
        _products.SlugExistsAsync("new-product", Arg.Any<CancellationToken>()).Returns(false);

        var handler = CreateHandler();
        var id = await handler.Handle(ValidCommand(), CancellationToken.None);

        Assert.NotEqual(Guid.Empty, id);
        await _products.Received(1).AddAsync(Arg.Is<Product>(p => p.Slug == "new-product"), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_throws_when_slug_already_exists()
    {
        _products.SlugExistsAsync("new-product", Arg.Any<CancellationToken>()).Returns(true);

        var handler = CreateHandler();

        await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(ValidCommand(), CancellationToken.None));
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public void Validator_accepts_valid_command()
    {
        var result = new CreateProductCommandValidator().Validate(ValidCommand());
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("Bad Slug")]      // spaces / uppercase
    [InlineData("bad_slug")]      // underscore
    [InlineData("")]              // empty
    public void Validator_rejects_invalid_slug(string slug)
    {
        var command = ValidCommand() with { Slug = slug };
        var result = new CreateProductCommandValidator().Validate(command);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_rejects_non_positive_price()
    {
        var command = ValidCommand() with { Price = 0m };
        var result = new CreateProductCommandValidator().Validate(command);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_rejects_compareAtPrice_below_price()
    {
        var command = ValidCommand() with { Price = 100m, CompareAtPrice = 50m };
        var result = new CreateProductCommandValidator().Validate(command);
        Assert.False(result.IsValid);
    }
}
