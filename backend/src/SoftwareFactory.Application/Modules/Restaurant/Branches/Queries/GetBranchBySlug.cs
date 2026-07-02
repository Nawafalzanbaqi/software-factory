using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Common.Caching;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Modules.Restaurant.Branches.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Branches.Queries;

/// <summary>GET /api/v1/branches/{slug} -> BranchDto (cached).</summary>
public sealed record GetBranchBySlugQuery(string Slug)
    : IRequest<BranchDto>, ICacheableQuery
{
    public string CacheKey => $"branch:slug:{Slug}";

    public TimeSpan? Ttl => TimeSpan.FromMinutes(15);
}

public sealed class GetBranchBySlugQueryHandler
    : IRequestHandler<GetBranchBySlugQuery, BranchDto>
{
    private readonly IBranchRepository _branches;

    public GetBranchBySlugQueryHandler(IBranchRepository branches) => _branches = branches;

    public async Task<BranchDto> Handle(GetBranchBySlugQuery request, CancellationToken cancellationToken)
    {
        var branch = await _branches.GetBySlugAsync(request.Slug, cancellationToken)
                     ?? throw new NotFoundException("Branch", request.Slug);

        return branch.ToDto();
    }
}

public sealed class GetBranchBySlugQueryValidator : AbstractValidator<GetBranchBySlugQuery>
{
    public GetBranchBySlugQueryValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().WithMessage("Slug is required.").MaximumLength(200);
    }
}
