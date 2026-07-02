using MediatR;
using SoftwareFactory.Application.Modules.Restaurant.Branches.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Branches.Queries;

/// <summary>GET /api/v1/branches -> BranchDto[] (with lat/lng for map).</summary>
public sealed record GetBranchesQuery : IRequest<IReadOnlyList<BranchDto>>;

public sealed class GetBranchesQueryHandler
    : IRequestHandler<GetBranchesQuery, IReadOnlyList<BranchDto>>
{
    private readonly IBranchRepository _branches;

    public GetBranchesQueryHandler(IBranchRepository branches) => _branches = branches;

    public async Task<IReadOnlyList<BranchDto>> Handle(GetBranchesQuery request, CancellationToken cancellationToken)
    {
        var branches = await _branches.GetAllAsync(cancellationToken);
        return branches.Select(b => b.ToDto()).ToList();
    }
}
