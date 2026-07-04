using System.Text.Json;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using Xunit;

namespace SoftwareFactory.Platform.Application.Tests;

/// <summary>
/// The "New Project" intake flow: create + validation (required fields,
/// siteType/section combos) and the generated options.json manifest.
/// </summary>
public class ProjectIntakeTests
{
    private static ProjectIntakeRequest ValidEcommerceIntake(
        IReadOnlyList<string>? sections = null,
        IReadOnlyList<string>? payments = null,
        IReadOnlyList<string>? integrations = null,
        IReadOnlyList<string>? features = null,
        string? language = "ar-en",
        string? designDirection = "premium") =>
        new(
            ClientName: "Acme Trading",
            ClientContact: "ops@acme.example",
            Language: language,
            DesignDirection: designDirection,
            Sections: sections ?? ["hero", "productListing", "categories", "footer"],
            Payments: payments ?? ["tamara", "tabby"],
            Integrations: integrations ?? ["zatca", "whatsapp"],
            Features: features ?? ["clientDashboard", "cms", "analytics"],
            Notes: "  Launch before Ramadan.  ");

    private static CreateProjectRequest IntakeRequest(
        string siteType = "ecommerce", ProjectIntakeRequest? intake = null, string name = "Acme Store") =>
        new(null, name, siteType, null, null, intake ?? ValidEcommerceIntake());

    // ---- create ----

    [Fact]
    public async Task Create_with_intake_persists_spec_creates_client_and_seeds_gates()
    {
        using var h = new TestHarness();

        var project = await h.Projects.CreateProjectAsync(IntakeRequest());

        var detail = await h.Projects.GetProjectDetailAsync(project.Id);
        Assert.NotNull(detail);
        Assert.Equal(3, detail!.Gates.Count);
        Assert.NotNull(detail.Intake);
        Assert.Equal("Acme Trading", detail.Intake!.ClientName);
        Assert.Equal("ops@acme.example", detail.Intake.ClientContact);
        Assert.Equal("rtl", detail.Intake.DefaultDirection);
        Assert.Equal("Launch before Ramadan.", detail.Intake.Notes);
        Assert.NotNull(detail.OptionsJson);

        // The client was registered from the intake contact details.
        var clients = await h.Clients.GetClientsAsync();
        var client = Assert.Single(clients);
        Assert.Equal("Acme Trading", client.Name);
        Assert.Equal("ops@acme.example", client.ContactEmail);
        Assert.Equal(client.Id, project.ClientId);
    }

    [Fact]
    public async Task Create_with_intake_reuses_existing_client_by_name_case_insensitively()
    {
        using var h = new TestHarness();
        var existing = await h.Clients.CreateClientAsync(new CreateClientRequest("ACME TRADING", "old@acme.example", null));

        var project = await h.Projects.CreateProjectAsync(IntakeRequest());

        Assert.Equal(existing.Id, project.ClientId);
        Assert.Single(await h.Clients.GetClientsAsync());
    }

    [Fact]
    public async Task Create_without_intake_and_without_clientId_is_rejected()
    {
        using var h = new TestHarness();

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            h.Projects.CreateProjectAsync(new CreateProjectRequest(null, "Store", "ecommerce", null, null)));

        Assert.Contains("clientId", ex.Message);
    }

    // ---- validation ----

    [Fact]
    public async Task Create_rejects_missing_required_intake_fields_and_lists_all_of_them()
    {
        using var h = new TestHarness();
        var empty = new ProjectIntakeRequest(null, null, null, null, null);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            h.Projects.CreateProjectAsync(IntakeRequest(intake: empty)));

        Assert.Contains("clientName", ex.Message);
        Assert.Contains("clientContact", ex.Message);
        Assert.Contains("language", ex.Message);
        Assert.Contains("designDirection", ex.Message);
        Assert.Contains("sections", ex.Message);
    }

    [Fact]
    public async Task Create_rejects_unknown_siteType()
    {
        using var h = new TestHarness();

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            h.Projects.CreateProjectAsync(IntakeRequest(siteType: "spaceport")));

        Assert.Contains("siteType", ex.Message);
    }

    [Fact]
    public async Task Create_rejects_section_not_valid_for_siteType()
    {
        using var h = new TestHarness();
        // "menu" belongs to restaurant, not ecommerce.
        var intake = ValidEcommerceIntake(sections: ["hero", "productListing", "footer", "menu"]);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            h.Projects.CreateProjectAsync(IntakeRequest(intake: intake)));

        Assert.Contains("menu", ex.Message);
        Assert.Contains("ecommerce", ex.Message);
    }

    [Fact]
    public async Task Create_rejects_missing_core_sections()
    {
        using var h = new TestHarness();
        var intake = ValidEcommerceIntake(sections: ["hero", "about"]); // productListing + footer missing

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            h.Projects.CreateProjectAsync(IntakeRequest(intake: intake)));

        Assert.Contains("core sections", ex.Message);
        Assert.Contains("productListing", ex.Message);
        Assert.Contains("footer", ex.Message);
    }

    [Fact]
    public async Task Create_rejects_unknown_payment_integration_or_feature_values()
    {
        using var h = new TestHarness();
        var intake = ValidEcommerceIntake(
            payments: ["tamara", "paypal"],
            integrations: ["zatca", "fax"],
            features: ["cms", "timeTravel"]);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            h.Projects.CreateProjectAsync(IntakeRequest(intake: intake)));

        Assert.Contains("paypal", ex.Message);
        Assert.Contains("fax", ex.Message);
        Assert.Contains("timeTravel", ex.Message);
    }

    [Fact]
    public async Task Zatca_is_recommended_for_ecommerce_but_never_forced()
    {
        using var h = new TestHarness();
        var intake = ValidEcommerceIntake(integrations: []); // no ZATCA selected

        // Creation succeeds — the recommendation lives in the catalog, not the validator.
        var project = await h.Projects.CreateProjectAsync(IntakeRequest(intake: intake));
        Assert.NotEqual(Guid.Empty, project.Id);

        var catalog = h.Projects.GetIntakeCatalog();
        var ecommerce = catalog.SiteTypes.Single(s => s.SiteType == "ecommerce");
        Assert.Contains("zatca", ecommerce.RecommendedIntegrations);
        var restaurant = catalog.SiteTypes.Single(s => s.SiteType == "restaurant");
        Assert.Empty(restaurant.RecommendedIntegrations);
    }

    // ---- options.json generation ----

    [Fact]
    public async Task OptionsJson_is_generated_correctly_from_the_intake_spec()
    {
        using var h = new TestHarness();
        // Deliberately submit payments/sections out of catalog order.
        var intake = ValidEcommerceIntake(
            sections: ["footer", "productListing", "hero", "faq"],
            payments: ["stripe", "tamara"]);

        var project = await h.Projects.CreateProjectAsync(IntakeRequest(intake: intake, name: "Noor Boutique"));
        var optionsJson = await h.Projects.GetProjectOptionsJsonAsync(project.Id);

        Assert.NotNull(optionsJson);
        using var doc = JsonDocument.Parse(optionsJson!);
        var root = doc.RootElement;

        Assert.Equal("./options.schema.json", root.GetProperty("$schema").GetString());
        Assert.Equal("ecommerce", root.GetProperty("siteType").GetString());
        Assert.Equal("Noor Boutique", root.GetProperty("siteName").GetString());
        Assert.Equal("ar-en", root.GetProperty("language").GetString());
        Assert.Equal("ar", root.GetProperty("defaultLocale").GetString());
        Assert.Equal("rtl", root.GetProperty("defaultDirection").GetString());
        Assert.Equal("SAR", root.GetProperty("currency").GetString());
        Assert.Equal("premium", root.GetProperty("designDirection").GetString());

        // Normalized to catalog order regardless of submission order.
        Assert.Equal(new[] { "tamara", "stripe" },
            root.GetProperty("payments").EnumerateArray().Select(e => e.GetString()).ToArray());
        Assert.Equal(new[] { "zatca", "whatsapp" },
            root.GetProperty("integrations").EnumerateArray().Select(e => e.GetString()).ToArray());

        var features = root.GetProperty("features");
        Assert.True(features.GetProperty("clientDashboard").GetBoolean());
        Assert.True(features.GetProperty("cms").GetBoolean());
        Assert.True(features.GetProperty("analytics").GetBoolean());
        Assert.False(features.GetProperty("wishlist").GetBoolean());
        Assert.False(features.GetProperty("reviews").GetBoolean());
        // clientDashboard expands into its per-module flags (content needs cms).
        Assert.True(features.GetProperty("dashboardOrders").GetBoolean());
        Assert.True(features.GetProperty("dashboardContent").GetBoolean());

        var sections = root.GetProperty("sections");
        Assert.True(sections.GetProperty("hero").GetProperty("enabled").GetBoolean());
        Assert.Equal(1, sections.GetProperty("hero").GetProperty("order").GetInt32());
        Assert.True(sections.GetProperty("productListing").GetProperty("enabled").GetBoolean());
        Assert.True(sections.GetProperty("faq").GetProperty("enabled").GetBoolean());
        Assert.Equal(99, sections.GetProperty("footer").GetProperty("order").GetInt32());
        // Unselected sections are present but disabled — the manifest is the full picture.
        Assert.False(sections.GetProperty("promoBanners").GetProperty("enabled").GetBoolean());
        Assert.False(sections.GetProperty("reviews").GetProperty("enabled").GetBoolean());
    }

    [Fact]
    public async Task OptionsJson_derives_ltr_for_english_only_builds()
    {
        using var h = new TestHarness();
        var intake = new ProjectIntakeRequest(
            ClientName: "Globex",
            ClientContact: "+966500000000",
            Language: "en",
            DesignDirection: "tech",
            Sections: ["hero", "featureHighlights", "cta", "footer"]);

        var project = await h.Projects.CreateProjectAsync(IntakeRequest(siteType: "landing", intake: intake));
        var optionsJson = await h.Projects.GetProjectOptionsJsonAsync(project.Id);

        using var doc = JsonDocument.Parse(optionsJson!);
        Assert.Equal("en", doc.RootElement.GetProperty("defaultLocale").GetString());
        Assert.Equal("ltr", doc.RootElement.GetProperty("defaultDirection").GetString());
        Assert.Equal("landing", doc.RootElement.GetProperty("siteType").GetString());
    }

    [Fact]
    public async Task OptionsJson_is_null_for_legacy_projects_and_missing_ids()
    {
        using var h = new TestHarness();
        var client = await h.Clients.CreateClientAsync(new CreateClientRequest("Legacy Co", null, null));
        var legacy = await h.Projects.CreateProjectAsync(
            new CreateProjectRequest(client.Id, "Legacy", "ecommerce", null, null));

        Assert.Null(await h.Projects.GetProjectOptionsJsonAsync(legacy.Id));
        Assert.Null(await h.Projects.GetProjectOptionsJsonAsync(Guid.NewGuid()));

        var detail = await h.Projects.GetProjectDetailAsync(legacy.Id);
        Assert.Null(detail!.Intake);
        Assert.Null(detail.OptionsJson);
    }

    // ---- catalog ----

    [Fact]
    public void IntakeCatalog_serves_sections_per_siteType_with_core_flags()
    {
        using var h = new TestHarness();

        var catalog = h.Projects.GetIntakeCatalog();

        Assert.Equal("KSA", catalog.Market);
        Assert.Equal("SAR", catalog.Currency);
        Assert.Equal(
            new[] { "ecommerce", "restaurant", "corporate", "landing", "portfolio", "booking" },
            catalog.SiteTypes.Select(s => s.SiteType).ToArray());

        var ecommerce = catalog.SiteTypes.Single(s => s.SiteType == "ecommerce");
        Assert.Contains(ecommerce.Sections, s => s is { Key: "productListing", Core: true });
        Assert.Contains(ecommerce.Sections, s => s is { Key: "promoBanners", Core: false });
        Assert.DoesNotContain(ecommerce.Sections, s => s.Key == "menu");

        var restaurant = catalog.SiteTypes.Single(s => s.SiteType == "restaurant");
        Assert.Contains(restaurant.Sections, s => s is { Key: "menu", Core: true });

        Assert.Contains("tabby", catalog.Payments);
        Assert.Contains("maps", catalog.Integrations);
        Assert.Contains("clientDashboard", catalog.Features);
    }
}
