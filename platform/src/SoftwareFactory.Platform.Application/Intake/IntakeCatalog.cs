namespace SoftwareFactory.Platform.Application.Intake;

/// <summary>One selectable section of a site type: catalog key, whether it is a
/// mandatory core section, and its canonical homepage order.</summary>
public sealed record SectionDefinition(string Key, bool Core, int Order);

/// <summary>
/// The single source of truth for what a "New Project" intake may select:
/// the wired site types, the valid section set per site type (with the core
/// sections that must be selected), and the allowed payments / integrations /
/// features / languages / design directions. Served to the dashboard via
/// GET /api/intake/catalog and enforced server-side on POST /api/projects.
/// </summary>
public static class IntakeCatalog
{
    /// <summary>The factory currently sells into one market; drives the ZATCA recommendation and SAR currency.</summary>
    public const string Market = "KSA";
    public const string Currency = "SAR";

    public static readonly IReadOnlyList<string> Languages = ["ar", "en", "ar-en"];
    public static readonly IReadOnlyList<string> DesignDirections = ["clean", "premium", "bold", "tech"];
    public static readonly IReadOnlyList<string> Payments = ["tamara", "tabby", "mada", "stripe"];
    public static readonly IReadOnlyList<string> Integrations = ["zatca", "whatsapp", "maps"];
    public static readonly IReadOnlyList<string> Features =
        ["clientDashboard", "cms", "reviews", "wishlist", "search", "faq", "loyalty", "analytics"];

    // Section catalogs per site type. ecommerce/restaurant mirror the shipped
    // options.json / options.restaurant.json manifests; the other four are the
    // intake contract for verticals whose build wiring lands in later phases.
    // Footer keeps the manifest convention of order 99.
    private static readonly Dictionary<string, IReadOnlyList<SectionDefinition>> SectionsBySiteType = new()
    {
        ["ecommerce"] =
        [
            new("hero", Core: true, Order: 1),
            new("promoBanners", Core: false, Order: 2),
            new("categories", Core: false, Order: 3),
            new("productListing", Core: true, Order: 4),
            new("reviews", Core: false, Order: 5),
            new("about", Core: false, Order: 6),
            new("faq", Core: false, Order: 7),
            new("contact", Core: false, Order: 8),
            new("footer", Core: true, Order: 99),
        ],
        ["restaurant"] =
        [
            new("hero", Core: true, Order: 1),
            new("promotions", Core: false, Order: 2),
            new("menu", Core: true, Order: 3),
            new("gallery", Core: false, Order: 4),
            new("branches", Core: false, Order: 5),
            new("reservation", Core: false, Order: 6),
            new("reviews", Core: false, Order: 7),
            new("about", Core: false, Order: 8),
            new("faq", Core: false, Order: 9),
            new("contact", Core: false, Order: 10),
            new("footer", Core: true, Order: 99),
        ],
        ["corporate"] =
        [
            new("hero", Core: true, Order: 1),
            new("services", Core: true, Order: 2),
            new("about", Core: true, Order: 3),
            new("team", Core: false, Order: 4),
            new("testimonials", Core: false, Order: 5),
            new("faq", Core: false, Order: 6),
            new("contact", Core: true, Order: 7),
            new("footer", Core: true, Order: 99),
        ],
        ["landing"] =
        [
            new("hero", Core: true, Order: 1),
            new("featureHighlights", Core: true, Order: 2),
            new("pricing", Core: false, Order: 3),
            new("testimonials", Core: false, Order: 4),
            new("faq", Core: false, Order: 5),
            new("cta", Core: true, Order: 6),
            new("contact", Core: false, Order: 7),
            new("footer", Core: true, Order: 99),
        ],
        ["portfolio"] =
        [
            new("hero", Core: true, Order: 1),
            new("gallery", Core: true, Order: 2),
            new("about", Core: true, Order: 3),
            new("services", Core: false, Order: 4),
            new("testimonials", Core: false, Order: 5),
            new("faq", Core: false, Order: 6),
            new("contact", Core: true, Order: 7),
            new("footer", Core: true, Order: 99),
        ],
        ["booking"] =
        [
            new("hero", Core: true, Order: 1),
            new("services", Core: true, Order: 2),
            new("booking", Core: true, Order: 3),
            new("pricing", Core: false, Order: 4),
            new("testimonials", Core: false, Order: 5),
            new("about", Core: false, Order: 6),
            new("faq", Core: false, Order: 7),
            new("contact", Core: true, Order: 8),
            new("footer", Core: true, Order: 99),
        ],
    };

    /// <summary>The site types wired for intake today, in display order.</summary>
    public static readonly IReadOnlyList<string> SiteTypes =
        ["ecommerce", "restaurant", "corporate", "landing", "portfolio", "booking"];

    public static bool IsKnownSiteType(string siteType) => SectionsBySiteType.ContainsKey(siteType);

    public static IReadOnlyList<SectionDefinition> SectionsFor(string siteType) =>
        SectionsBySiteType.TryGetValue(siteType, out var sections) ? sections : [];

    /// <summary>ZATCA e-invoicing is recommended (never forced) for ecommerce in the KSA market.</summary>
    public static IReadOnlyList<string> RecommendedIntegrationsFor(string siteType) =>
        siteType == "ecommerce" ? ["zatca"] : [];

    /// <summary>ar and ar-en builds default to Arabic/RTL; en-only builds to English/LTR.</summary>
    public static (string DefaultLocale, string DefaultDirection) DeriveDirection(string language) =>
        language == "en" ? ("en", "ltr") : ("ar", "rtl");
}
