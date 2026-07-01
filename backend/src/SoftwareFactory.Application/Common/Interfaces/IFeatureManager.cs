namespace SoftwareFactory.Application.Common.Interfaces;

/// <summary>
/// Reads the root options.json manifest. Drives conditional endpoint
/// registration and seeding (feature-flag pattern — code is never deleted,
/// only conditionally activated).
/// </summary>
public interface IFeatureManager
{
    /// <summary>Is a <c>features.&lt;name&gt;</c> flag enabled?</summary>
    bool IsFeatureEnabled(string name);

    /// <summary>Is a <c>sections.&lt;name&gt;</c> block enabled?</summary>
    bool IsSectionEnabled(string name);
}
