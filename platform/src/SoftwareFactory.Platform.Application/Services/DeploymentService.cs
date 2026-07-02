using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Entities;

namespace SoftwareFactory.Platform.Application.Services;

public sealed class DeploymentService : IDeploymentService
{
    private readonly IProjectRepository _projects;
    private readonly IDeploymentEventRepository _events;
    private readonly IUnitOfWork _uow;

    public DeploymentService(IProjectRepository projects, IDeploymentEventRepository events, IUnitOfWork uow)
    {
        _projects = projects;
        _events = events;
        _uow = uow;
    }

    public async Task<DeploymentEventDto> RecordDeploymentEventAsync(Guid projectId, CreateDeploymentRequest request, CancellationToken ct = default)
    {
        var project = await _projects.GetByIdAsync(projectId, ct)
            ?? throw NotFoundException.For(nameof(Project), projectId);

        var evt = new DeploymentEvent
        {
            ProjectId = project.Id,
            Status = request.Status,
            Source = request.Source,
            Payload = string.IsNullOrWhiteSpace(request.Payload) ? "{}" : request.Payload
        };

        await _events.AddAsync(evt, ct);
        await _uow.SaveChangesAsync(ct);
        return evt.ToDto();
    }

    public async Task<IReadOnlyList<DeploymentEventDto>> GetProjectDeploymentsAsync(Guid projectId, CancellationToken ct = default)
    {
        var events = await _events.ListByProjectAsync(projectId, ct);
        return events.Select(e => e.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<DeploymentEventDto>> GetDeploymentsSinceAsync(DateTimeOffset since, CancellationToken ct = default)
    {
        var events = await _events.ListSinceAsync(since, ct);
        return events.Select(e => e.ToDto()).ToList();
    }
}
