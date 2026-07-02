using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Entities;

namespace SoftwareFactory.Platform.Application.Services;

public sealed class UsageService : IUsageService
{
    private readonly IProjectRepository _projects;
    private readonly IApiUsageRepository _usage;
    private readonly IUnitOfWork _uow;

    public UsageService(IProjectRepository projects, IApiUsageRepository usage, IUnitOfWork uow)
    {
        _projects = projects;
        _usage = usage;
        _uow = uow;
    }

    public async Task<ApiUsageRecordDto> RecordUsageAsync(Guid projectId, CreateUsageRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Model))
            throw new ValidationException("model is required.");
        if (request.Tokens < 0)
            throw new ValidationException("tokens must be >= 0.");
        if (request.CostUsd < 0)
            throw new ValidationException("costUsd must be >= 0.");

        var project = await _projects.GetByIdAsync(projectId, ct)
            ?? throw NotFoundException.For(nameof(Project), projectId);

        var record = new ApiUsageRecord
        {
            ProjectId = project.Id,
            Model = request.Model.Trim(),
            Tokens = request.Tokens,
            CostUsd = request.CostUsd
        };

        await _usage.AddAsync(record, ct);
        await _uow.SaveChangesAsync(ct);
        return record.ToDto();
    }

    public async Task<ProjectUsageDto> GetUsageAsync(Guid projectId, CancellationToken ct = default)
    {
        var records = await _usage.ListByProjectAsync(projectId, ct);
        var dtos = records
            .OrderByDescending(r => r.RecordedAt)
            .Select(r => r.ToDto())
            .ToList();
        return new ProjectUsageDto(dtos, dtos.Sum(r => r.CostUsd), dtos.Sum(r => r.Tokens));
    }
}
