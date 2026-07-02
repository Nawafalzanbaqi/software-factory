using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Entities;
using SoftwareFactory.Platform.Domain.Enums;

namespace SoftwareFactory.Platform.Application.Services;

public sealed class ProjectService : IProjectService
{
    private readonly IProjectRepository _projects;
    private readonly IClientRepository _clients;
    private readonly IUnitOfWork _uow;

    public ProjectService(IProjectRepository projects, IClientRepository clients, IUnitOfWork uow)
    {
        _projects = projects;
        _clients = clients;
        _uow = uow;
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ValidationException("Project name is required.");
        if (string.IsNullOrWhiteSpace(request.SiteType))
            throw new ValidationException("Project siteType is required.");

        var client = await _clients.GetByIdAsync(request.ClientId, ct)
            ?? throw NotFoundException.For(nameof(Client), request.ClientId);

        var project = new Project
        {
            ClientId = client.Id,
            Name = request.Name.Trim(),
            SiteType = request.SiteType.Trim(),
            CurrentPhase = ProjectPhase.Intake,
            RepoUrl = string.IsNullOrWhiteSpace(request.RepoUrl) ? null : request.RepoUrl.Trim(),
            Branch = string.IsNullOrWhiteSpace(request.Branch) ? null : request.Branch.Trim()
        };

        // Seed the 3 human gates, all unapproved.
        foreach (var gateType in Enum.GetValues<GateType>())
        {
            project.Gates.Add(new ApprovalGate
            {
                ProjectId = project.Id,
                GateType = gateType
            });
        }

        await _projects.AddAsync(project, ct);
        await _uow.SaveChangesAsync(ct);
        return project.ToDto();
    }

    public async Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(CancellationToken ct = default)
    {
        var projects = await _projects.ListAsync(ct);
        return projects.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProjectDto?> GetProjectAsync(Guid id, CancellationToken ct = default)
    {
        var project = await _projects.GetByIdAsync(id, ct);
        return project?.ToDto();
    }

    public async Task<ProjectDetailDto?> GetProjectDetailAsync(Guid id, CancellationToken ct = default)
    {
        var project = await _projects.GetWithDetailsAsync(id, ct);
        if (project is null) return null;

        var gates = project.Gates
            .OrderBy(g => g.GateType)
            .Select(g => g.ToDto())
            .ToList();

        var usageRecords = project.UsageRecords
            .OrderByDescending(r => r.RecordedAt)
            .Select(r => r.ToDto())
            .ToList();

        var usage = new ProjectUsageDto(
            usageRecords,
            usageRecords.Sum(r => r.CostUsd),
            usageRecords.Sum(r => r.Tokens));

        var recentDeployments = project.Deployments
            .OrderByDescending(d => d.OccurredAt)
            .Take(10)
            .Select(d => d.ToDto())
            .ToList();

        return new ProjectDetailDto(project.ToDto(), gates, usage, recentDeployments);
    }

    public async Task<ProjectDto?> UpdatePhaseAsync(Guid id, ProjectPhase phase, CancellationToken ct = default)
    {
        var project = await _projects.GetByIdAsync(id, ct);
        if (project is null) return null;

        project.CurrentPhase = phase;
        await _uow.SaveChangesAsync(ct);
        return project.ToDto();
    }
}
