using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.ValueObjects;

namespace SoftwareFactory.Platform.Application.Intake;

/// <summary>
/// Guard-clause validation for the intake payload (platform tier deliberately
/// skips FluentValidation). Collects every violation so the dashboard can show
/// the operator the full list in one 400, then normalizes the payload into an
/// <see cref="IntakeSpec"/> (trimmed, de-duplicated, catalog-ordered).
/// </summary>
public static class IntakeValidator
{
    private const int MaxNameLength = 200;
    private const int MaxContactLength = 320;
    private const int MaxNotesLength = 2000;

    public static IReadOnlyList<string> Validate(string siteType, ProjectIntakeRequest intake)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(intake.ClientName))
            errors.Add("clientName is required.");
        else if (intake.ClientName.Trim().Length > MaxNameLength)
            errors.Add($"clientName must be at most {MaxNameLength} characters.");

        if (string.IsNullOrWhiteSpace(intake.ClientContact))
            errors.Add("clientContact is required.");
        else if (intake.ClientContact.Trim().Length > MaxContactLength)
            errors.Add($"clientContact must be at most {MaxContactLength} characters.");

        if (!IntakeCatalog.IsKnownSiteType(siteType))
            errors.Add($"siteType must be one of: {string.Join(", ", IntakeCatalog.SiteTypes)}.");

        if (string.IsNullOrWhiteSpace(intake.Language))
            errors.Add("language is required.");
        else if (!IntakeCatalog.Languages.Contains(intake.Language))
            errors.Add($"language must be one of: {string.Join(", ", IntakeCatalog.Languages)}.");

        if (string.IsNullOrWhiteSpace(intake.DesignDirection))
            errors.Add("designDirection is required.");
        else if (!IntakeCatalog.DesignDirections.Contains(intake.DesignDirection))
            errors.Add($"designDirection must be one of: {string.Join(", ", IntakeCatalog.DesignDirections)}.");

        // Sections are only checkable against a known site type.
        if (IntakeCatalog.IsKnownSiteType(siteType))
        {
            var allowed = IntakeCatalog.SectionsFor(siteType);
            var selected = Normalize(intake.Sections);

            if (selected.Count == 0)
            {
                errors.Add("sections is required: select at least the core sections.");
            }
            else
            {
                var invalid = selected.Where(s => allowed.All(a => a.Key != s)).ToList();
                if (invalid.Count > 0)
                    errors.Add($"sections not valid for siteType '{siteType}': {string.Join(", ", invalid)}.");

                var missingCore = allowed.Where(a => a.Core && !selected.Contains(a.Key)).Select(a => a.Key).ToList();
                if (missingCore.Count > 0)
                    errors.Add($"core sections must be selected for siteType '{siteType}': {string.Join(", ", missingCore)}.");
            }
        }

        AddUnknownValueErrors(errors, "payments", intake.Payments, IntakeCatalog.Payments);
        AddUnknownValueErrors(errors, "integrations", intake.Integrations, IntakeCatalog.Integrations);
        AddUnknownValueErrors(errors, "features", intake.Features, IntakeCatalog.Features);

        if (intake.Notes is { Length: > MaxNotesLength })
            errors.Add($"notes must be at most {MaxNotesLength} characters.");

        return errors;
    }

    /// <summary>Builds the normalized spec. Call only after <see cref="Validate"/> returned no errors.</summary>
    public static IntakeSpec ToSpec(string siteType, ProjectIntakeRequest intake)
    {
        var sections = Normalize(intake.Sections);
        return new IntakeSpec(
            ClientName: intake.ClientName!.Trim(),
            ClientContact: intake.ClientContact!.Trim(),
            Language: intake.Language!,
            DesignDirection: intake.DesignDirection!,
            // Catalog order makes the spec (and the generated manifest) deterministic
            // regardless of the order the form submitted the values in.
            Sections: IntakeCatalog.SectionsFor(siteType).Select(s => s.Key).Where(sections.Contains).ToList(),
            Payments: InCatalogOrder(intake.Payments, IntakeCatalog.Payments),
            Integrations: InCatalogOrder(intake.Integrations, IntakeCatalog.Integrations),
            Features: InCatalogOrder(intake.Features, IntakeCatalog.Features),
            Notes: string.IsNullOrWhiteSpace(intake.Notes) ? null : intake.Notes.Trim());
    }

    private static void AddUnknownValueErrors(
        List<string> errors, string field, IReadOnlyList<string>? values, IReadOnlyList<string> catalog)
    {
        var unknown = Normalize(values).Where(v => !catalog.Contains(v)).ToList();
        if (unknown.Count > 0)
            errors.Add($"{field} contains unknown values: {string.Join(", ", unknown)}. Allowed: {string.Join(", ", catalog)}.");
    }

    private static HashSet<string> Normalize(IReadOnlyList<string>? values) =>
        (values ?? []).Select(v => v?.Trim() ?? string.Empty).Where(v => v.Length > 0).ToHashSet();

    private static List<string> InCatalogOrder(IReadOnlyList<string>? values, IReadOnlyList<string> catalog)
    {
        var selected = Normalize(values);
        return catalog.Where(selected.Contains).ToList();
    }
}
