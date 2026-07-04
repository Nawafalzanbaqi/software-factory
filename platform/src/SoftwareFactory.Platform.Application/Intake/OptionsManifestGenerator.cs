using System.Text.Json;
using System.Text.Json.Nodes;
using SoftwareFactory.Platform.Domain.ValueObjects;

namespace SoftwareFactory.Platform.Application.Intake;

/// <summary>
/// Generates the normalized options.json build manifest from a validated
/// <see cref="IntakeSpec"/> — the exact string the factory build consumes
/// (same shape and key order as the repo's options.&lt;vertical&gt;.json files,
/// valid against options.schema.json). Stored on the project verbatim and
/// served by GET /api/projects/{id}/options.json.
/// </summary>
public static class OptionsManifestGenerator
{
    private static readonly JsonSerializerOptions WriteOptions = new() { WriteIndented = true };

    public static string Generate(string projectName, string siteType, IntakeSpec spec)
    {
        var (defaultLocale, defaultDirection) = IntakeCatalog.DeriveDirection(spec.Language);

        var features = new JsonObject();
        foreach (var feature in IntakeCatalog.Features)
            features[feature] = spec.Features.Contains(feature);

        // clientDashboard is the master switch; the shipped manifests always pair it
        // with its per-module flags, so a dashboard is never generated empty.
        // dashboardContent deep-links into the Payload admin and needs cms.
        if (spec.Features.Contains("clientDashboard"))
        {
            features["dashboardOrders"] = true;
            features["dashboardCatalog"] = true;
            features["dashboardUsers"] = true;
            features["dashboardSettings"] = true;
            features["dashboardContent"] = spec.Features.Contains("cms");
        }

        var sections = new JsonObject();
        foreach (var section in IntakeCatalog.SectionsFor(siteType))
        {
            sections[section.Key] = new JsonObject
            {
                ["enabled"] = spec.Sections.Contains(section.Key),
                ["order"] = section.Order,
            };
        }

        var manifest = new JsonObject
        {
            ["$schema"] = "./options.schema.json",
            ["siteType"] = siteType,
            ["siteName"] = projectName,
            ["language"] = spec.Language,
            ["defaultLocale"] = defaultLocale,
            ["defaultDirection"] = defaultDirection,
            ["currency"] = IntakeCatalog.Currency,
            ["payments"] = new JsonArray(spec.Payments.Select(p => (JsonNode)p).ToArray()),
            ["integrations"] = new JsonArray(spec.Integrations.Select(i => (JsonNode)i).ToArray()),
            ["features"] = features,
            ["sections"] = sections,
            ["designDirection"] = spec.DesignDirection,
        };

        return manifest.ToJsonString(WriteOptions);
    }
}
