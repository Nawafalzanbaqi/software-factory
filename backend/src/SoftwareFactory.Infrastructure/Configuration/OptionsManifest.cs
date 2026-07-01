using System.Text.Json;
using System.Text.Json.Serialization;

namespace SoftwareFactory.Infrastructure.Configuration;

/// <summary>
/// Typed view over the root <c>options.json</c> manifest.
/// </summary>
public sealed class OptionsManifest
{
    [JsonPropertyName("siteType")] public string SiteType { get; init; } = "ecommerce";
    [JsonPropertyName("siteName")] public string? SiteName { get; init; }
    [JsonPropertyName("currency")] public string Currency { get; init; } = "SAR";
    [JsonPropertyName("defaultLocale")] public string DefaultLocale { get; init; } = "ar";

    [JsonPropertyName("features")] public Dictionary<string, bool> Features { get; init; } = new();
    [JsonPropertyName("sections")] public Dictionary<string, SectionOption> Sections { get; init; } = new();
    [JsonPropertyName("payments")] public List<string> Payments { get; init; } = new();
    [JsonPropertyName("integrations")] public List<string> Integrations { get; init; } = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    /// <summary>
    /// Loads the manifest, probing the given candidate paths in order.
    /// Falls back to an all-defaults manifest if none is found.
    /// </summary>
    public static OptionsManifest Load(IEnumerable<string> candidatePaths)
    {
        foreach (var path in candidatePaths)
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            {
                continue;
            }

            var json = File.ReadAllText(path);
            var manifest = JsonSerializer.Deserialize<OptionsManifest>(json, JsonOptions);
            if (manifest is not null)
            {
                return manifest;
            }
        }

        return new OptionsManifest();
    }
}

public sealed class SectionOption
{
    [JsonPropertyName("enabled")] public bool Enabled { get; init; }
    [JsonPropertyName("order")] public int Order { get; init; }
}
