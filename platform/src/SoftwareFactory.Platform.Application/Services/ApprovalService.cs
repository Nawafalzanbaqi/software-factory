using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Entities;

namespace SoftwareFactory.Platform.Application.Services;

public sealed class ApprovalService : IApprovalService
{
    private readonly IProjectRepository _projects;
    private readonly IApprovalGateRepository _gates;
    private readonly IUnitOfWork _uow;

    public ApprovalService(IProjectRepository projects, IApprovalGateRepository gates, IUnitOfWork uow)
    {
        _projects = projects;
        _gates = gates;
        _uow = uow;
    }

    public async Task<ApprovalGateDto> RecordApprovalAsync(Guid projectId, CreateApprovalRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ApprovedBy))
            throw new ValidationException("approvedBy is required.");

        var project = await _projects.GetByIdAsync(projectId, ct)
            ?? throw NotFoundException.For(nameof(Project), projectId);

        var gate = await _gates.GetByProjectAndTypeAsync(project.Id, request.GateType, ct)
            ?? throw new NotFoundException($"Gate '{request.GateType}' was not found for project '{projectId}'.");

        gate.ApprovedBy = request.ApprovedBy.Trim();
        gate.ApprovedAt = DateTimeOffset.UtcNow;
        gate.Notes = request.Notes;

        await _uow.SaveChangesAsync(ct);
        return gate.ToDto();
    }
}
