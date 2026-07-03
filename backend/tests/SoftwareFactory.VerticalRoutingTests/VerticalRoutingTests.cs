using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SoftwareFactory.VerticalRoutingTests;

/// <summary>
/// Proves the config-driven vertical switch (PHASE2.md §6): the SAME backend
/// boots as either vertical (selected by <c>SF_OPTIONS_FILE</c>) and only the
/// active vertical's routes are registered. Uses <see cref="WebApplicationFactory{T}"/>
/// with <c>SF_SKIP_DB_INIT=1</c> so no Postgres is required — it inspects the
/// registered <see cref="EndpointDataSource"/> directly.
/// </summary>
public class VerticalRoutingTests
{
    // Env vars are process-global; serialize the two boots.
    private static readonly object Gate = new();

    private static IReadOnlyList<string> GetRoutes(string optionsFile)
    {
        lock (Gate)
        {
            Environment.SetEnvironmentVariable("SF_SKIP_DB_INIT", "1");
            Environment.SetEnvironmentVariable("SF_OPTIONS_FILE", optionsFile);
            try
            {
                using var factory = new WebApplicationFactory<Program>();
                // Force the host to build so the endpoint data source is populated.
                _ = factory.Server;

                var endpoints = factory.Services.GetRequiredService<EndpointDataSource>();
                return endpoints.Endpoints
                    .OfType<RouteEndpoint>()
                    .Select(e => "/" + (e.RoutePattern.RawText ?? string.Empty).TrimStart('/'))
                    .ToList();
            }
            finally
            {
                Environment.SetEnvironmentVariable("SF_OPTIONS_FILE", null);
                Environment.SetEnvironmentVariable("SF_SKIP_DB_INIT", null);
            }
        }
    }

    private static bool HasPrefix(IReadOnlyList<string> routes, string prefix) =>
        routes.Any(r => r.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));

    [Fact]
    public void Ecommerce_boot_exposes_products_and_not_menu()
    {
        var routes = GetRoutes("options.ecommerce.json");

        Assert.True(HasPrefix(routes, "/api/v1/products"), "ecommerce boot should expose /api/v1/products*");
        Assert.False(HasPrefix(routes, "/api/v1/menu"), "ecommerce boot should NOT expose /api/v1/menu*");
        Assert.False(HasPrefix(routes, "/api/v1/branches"), "ecommerce boot should NOT expose /api/v1/branches*");
        Assert.False(HasPrefix(routes, "/api/v1/reservations"), "ecommerce boot should NOT expose /api/v1/reservations*");

        // Shared modules present in both verticals.
        Assert.True(HasPrefix(routes, "/api/v1/cart"), "cart is shared and should be present");
        // Phase 4: dashboard order management is shared and clientDashboard=true in the manifest.
        Assert.True(HasPrefix(routes, "/api/v1/manage/orders"), "ecommerce boot should expose /api/v1/manage/orders*");
    }

    [Fact]
    public void Restaurant_boot_exposes_menu_branches_reservations_and_not_products()
    {
        var routes = GetRoutes("options.restaurant.json");

        Assert.True(HasPrefix(routes, "/api/v1/menu"), "restaurant boot should expose /api/v1/menu*");
        Assert.True(HasPrefix(routes, "/api/v1/branches"), "restaurant boot should expose /api/v1/branches*");
        Assert.True(HasPrefix(routes, "/api/v1/reservations"), "restaurant boot should expose /api/v1/reservations*");
        Assert.False(HasPrefix(routes, "/api/v1/products"), "restaurant boot should NOT expose /api/v1/products*");

        // Shared modules present in both verticals.
        Assert.True(HasPrefix(routes, "/api/v1/cart"), "cart is shared and should be present");
        // Phase 4: dashboard order management is shared and clientDashboard=true in the manifest.
        Assert.True(HasPrefix(routes, "/api/v1/manage/orders"), "restaurant boot should expose /api/v1/manage/orders*");
    }

    [Fact]
    public void Disabled_clientDashboard_removes_manage_routes()
    {
        // Phase 4 flag-off proof: same boot with features.clientDashboard=false must
        // not map the manage endpoints (disabled feature => 404, absent from OpenAPI).
        var manifest = File.ReadAllText(FindRepoFile("options.ecommerce.json"));
        manifest = manifest.Replace("\"clientDashboard\": true", "\"clientDashboard\": false");

        var tempFile = Path.Combine(Path.GetTempPath(), $"options.dashboard-off.{Guid.NewGuid():N}.json");
        File.WriteAllText(tempFile, manifest);
        try
        {
            var routes = GetRoutes(tempFile);

            Assert.False(HasPrefix(routes, "/api/v1/manage/orders"),
                "clientDashboard=false boot should NOT expose /api/v1/manage/orders*");
            // The rest of the vertical is unaffected by the dashboard flag.
            Assert.True(HasPrefix(routes, "/api/v1/products"), "products should still be mapped");
            Assert.True(HasPrefix(routes, "/api/v1/orders"), "public order tracking should still be mapped");
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    /// <summary>Walk up from the test base directory to find a repo-root file.</summary>
    private static string FindRepoFile(string fileName)
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, fileName);
            if (File.Exists(candidate))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        throw new FileNotFoundException($"Could not locate {fileName} above {AppContext.BaseDirectory}.");
    }
}
