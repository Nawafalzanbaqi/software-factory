using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Catalog.Products;
using SoftwareFactory.Domain.Modules.Reviews;

namespace SoftwareFactory.Application.Modules.Reviews.Commands.CreateReview;

public sealed class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, Guid>
{
    private readonly IReviewRepository _reviews;
    private readonly IProductRepository _products;
    private readonly IUnitOfWork _unitOfWork;

    public CreateReviewCommandHandler(
        IReviewRepository reviews,
        IProductRepository products,
        IUnitOfWork unitOfWork)
    {
        _reviews = reviews;
        _products = products;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        _ = await _products.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException("Product", request.ProductId);

        var review = new Review(request.ProductId, request.Author, request.Rating, request.Title, request.Body);
        await _reviews.AddAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return review.Id;
    }
}
