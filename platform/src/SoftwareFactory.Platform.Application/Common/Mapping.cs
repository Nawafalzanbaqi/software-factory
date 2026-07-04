using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Application.Intake;
using SoftwareFactory.Platform.Domain.Entities;
using SoftwareFactory.Platform.Domain.ValueObjects;

namespace SoftwareFactory.Platform.Application.Common;

/// <summary>Plain entity -> DTO projections (no AutoMapper; keep it obvious).</summary>
internal static class Mapping
{
    public static ClientDto ToDto(this Client c) =>
        new(c.Id, c.Name, c.ContactEmail, c.Notes, c.CreatedAt);

    public static ProjectIntakeDto ToDto(this IntakeSpec s) =>
        new(
            s.ClientName,
            s.ClientContact,
            s.Language,
            IntakeCatalog.DeriveDirection(s.Language).DefaultDirection,
            s.DesignDirection,
            s.Sections,
            s.Payments,
            s.Integrations,
            s.Features,
            s.Notes);

    public static ProjectDto ToDto(this Project p) =>
        new(p.Id, p.ClientId, p.Name, p.SiteType, p.CurrentPhase, p.RepoUrl, p.Branch, p.LiveUrl, p.CreatedAt);

    public static ApprovalGateDto ToDto(this ApprovalGate g) =>
        new(g.Id, g.ProjectId, g.GateType, g.ApprovedBy, g.ApprovedAt, g.Notes, g.IsApproved);

    public static ApiUsageRecordDto ToDto(this ApiUsageRecord r) =>
        new(r.Id, r.ProjectId, r.Model, r.Tokens, r.CostUsd, r.RecordedAt);

    public static DeploymentEventDto ToDto(this DeploymentEvent e) =>
        new(e.Id, e.ProjectId, e.Status, e.Source, e.Payload, e.OccurredAt);
}
