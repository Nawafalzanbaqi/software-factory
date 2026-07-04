using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Application.Intake;
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

        var name = request.Name.Trim();
        var siteType = request.SiteType.Trim();

        var project = new Project
        {
            Name = name,
            SiteType = siteType,
            CurrentPhase = ProjectPhase.Intake,
            RepoUrl = string.IsNullOrWhiteSpace(request.RepoUrl) ? null : request.RepoUrl.Trim(),
            Branch = string.IsNullOrWhiteSpace(request.Branch) ? null : request.Branch.Trim()
        };

        if (request.Intake is null)
        {
            // Legacy mode: the caller references an existing client.
            if (request.ClientId is not { } clientId)
                throw new ValidationException("clientId is required when no intake payload is provided.");
            var client = await _clients.GetByIdAsync(clientId, ct)
                ?? throw NotFoundException.For(nameof(Client), clientId);
            project.ClientId = client.Id;
        }
        else
        {
            // Intake mode: validate everything, resolve the client by id or name,
            // persist the normalized spec and the generated options.json manifest.
            var errors = IntakeValidator.Validate(siteType, request.Intake);
            if (errors.Count > 0)
                throw new ValidationException(string.Join(" ", errors));

            var spec = IntakeValidator.ToSpec(siteType, request.Intake);
            project.ClientId = (await ResolveIntakeClientAsync(request.ClientId, spec.ClientName, spec.ClientContact, ct)).Id;
            project.IntakeSpec = spec;
            project.OptionsJson = OptionsManifestGenerator.Generate(name, siteType, spec);
        }

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

    /// <summary>Prefers an explicit clientId; otherwise reuses a client with the same
    /// name (case-insensitive) or registers a new one from the intake contact details.</summary>
    private async Task<Client> ResolveIntakeClientAsync(Guid? clientId, string clientName, string clientContact, CancellationToken ct)
    {
        if (clientId is { } id)
        {
            return await _clients.GetByIdAsync(id, ct)
                ?? throw NotFoundException.For(nameof(Client), id);
        }

        var existing = await _clients.GetByNameAsync(clientName, ct);
        if (existing is not null) return existing;

        var client = new Client { Name = clientName, ContactEmail = clientContact };
        await _clients.AddAsync(client, ct);
        return client;
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

        return new ProjectDetailDto(
            project.ToDto(),
            gates,
            usage,
            recentDeployments,
            project.IntakeSpec?.ToDto(),
            project.OptionsJson);
    }

    public async Task<string?> GetProjectOptionsJsonAsync(Guid id, CancellationToken ct = default)
    {
        var project = await _projects.GetByIdAsync(id, ct);
        return project?.OptionsJson;
    }

    public IntakeCatalogDto GetIntakeCatalog() =>
        new(
            IntakeCatalog.Market,
            IntakeCatalog.Currency,
            IntakeCatalog.Languages,
            IntakeCatalog.DesignDirections,
            IntakeCatalog.Payments,
            IntakeCatalog.Integrations,
            IntakeCatalog.Features,
            IntakeCatalog.SiteTypes
                .Select(siteType => new IntakeSiteTypeDto(
                    siteType,
                    IntakeCatalog.SectionsFor(siteType)
                        .Select(s => new IntakeSectionOptionDto(s.Key, s.Core, s.Order))
                        .ToList(),
                    IntakeCatalog.RecommendedIntegrationsFor(siteType)))
                .ToList());

    public async Task<ProjectDto?> UpdatePhaseAsync(Guid id, ProjectPhase phase, CancellationToken ct = default)
    {
        var project = await _projects.GetByIdAsync(id, ct);
        if (project is null) return null;

        project.CurrentPhase = phase;
        await _uow.SaveChangesAsync(ct);
        return project.ToDto();
    }
}
