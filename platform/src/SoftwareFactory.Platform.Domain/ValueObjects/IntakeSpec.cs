namespace SoftwareFactory.Platform.Domain.ValueObjects;

/// <summary>
/// The mandatory intake criteria captured when a client project is registered
/// through the dashboard's "New Project" flow. Immutable; persisted on
/// <see cref="Entities.Project"/> as a JSON column. The normalized options.json
/// build manifest is generated from this spec at creation time.
/// </summary>
public sealed record IntakeSpec(
    string ClientName,
    string ClientContact,
    string Language,
    string DesignDirection,
    IReadOnlyList<string> Sections,
    IReadOnlyList<string> Payments,
    IReadOnlyList<string> Integrations,
    IReadOnlyList<string> Features,
    string? Notes);
