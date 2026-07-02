namespace SoftwareFactory.Application.Common.Interfaces;

/// <summary>
/// Reads the root options.json manifest. Drives conditional endpoint
/// registration and seeding (feature-flag pattern — code is never deleted,
/// only conditionally activated).
/// </summary>
public interface IFeatureManager
{
    /// <summary>The active vertical (<c>options.json.siteType</c>), e.g. "ecommerce" or "restaurant".</summary>
    string SiteType { get; }

    /// <summary>Does the active <see cref="SiteType"/> match <paramref name="name"/> (case-insensitive)?</summary>
    bool IsVertical(string name);

    /// <summary>Is a <c>features.&lt;name&gt;</c> flag enabled?</summary>
    bool IsFeatureEnabled(string name);

    /// <summary>Is a <c>sections.&lt;name&gt;</c> block enabled?</summary>
    bool IsSectionEnabled(string name);
}
