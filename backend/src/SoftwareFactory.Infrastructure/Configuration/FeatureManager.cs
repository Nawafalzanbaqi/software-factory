using SoftwareFactory.Application.Common.Interfaces;

namespace SoftwareFactory.Infrastructure.Configuration;

/// <summary>
/// Reads feature/section flags from the loaded <see cref="OptionsManifest"/>.
/// Registered as a singleton (the manifest is immutable at runtime).
/// </summary>
public sealed class FeatureManager : IFeatureManager
{
    private readonly OptionsManifest _manifest;

    public FeatureManager(OptionsManifest manifest) => _manifest = manifest;

    public string SiteType => _manifest.SiteType;

    public bool IsVertical(string name) =>
        string.Equals(_manifest.SiteType, name, StringComparison.OrdinalIgnoreCase);

    public bool IsFeatureEnabled(string name) =>
        _manifest.Features.TryGetValue(name, out var enabled) && enabled;

    public bool IsSectionEnabled(string name) =>
        _manifest.Sections.TryGetValue(name, out var section) && section.Enabled;
}
