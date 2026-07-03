using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using SoftwareFactory.Api.Identity;
using Xunit;

// VerticalRoutingTests flips process-global env vars (SF_OPTIONS_FILE) around
// its boots; run the two boot-test classes serially so a concurrent Production
// boot never reads a temp manifest that is being deleted. (Single-class before
// Phase 4 security fixes, so this changes nothing for the existing tests.)
[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace SoftwareFactory.VerticalRoutingTests;

/// <summary>
/// Security-audit regression (fix #1): outside Development the API must FAIL
/// CLOSED at boot — no signing key, a dev-constant key/issuer/audience, or a
/// missing issuer/audience must throw instead of accepting forgeable bearers.
/// Boots the real <see cref="Program"/> via <see cref="WebApplicationFactory{T}"/>
/// (no Postgres needed: the seed/migrate block is Development-only).
/// </summary>
public class ProductionJwtBootTests
{
    private const string RealKey = "unit-test-production-key-0123456789abcdef";
    private const string RealIssuer = "client-deployment";
    private const string RealAudience = "client-deployment-web";

    private static Exception? BootProduction(params (string Key, string? Value)[] settings)
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            foreach (var (key, value) in settings)
            {
                builder.UseSetting(key, value);
            }
        });

        return Record.Exception(() => _ = factory.Server);
    }

    /// <summary>The thrown InvalidOperationException may be wrapped by the host.</summary>
    private static void AssertBootRefused(Exception? exception, string expectedFragment)
    {
        Assert.NotNull(exception);
        var messages = new List<string>();
        for (var e = exception; e is not null; e = e.InnerException)
        {
            messages.Add($"{e.GetType().Name}: {e.Message}");
        }

        Assert.True(
            messages.Any(m => m.Contains("InvalidOperationException") && m.Contains(expectedFragment)),
            $"expected an InvalidOperationException mentioning '{expectedFragment}', got: {string.Join(" | ", messages)}");
    }

    [Fact]
    public void Production_boot_without_a_key_fails_loudly()
    {
        // appsettings.json ships Jwt:Key = "" — a prod boot with no env override
        // must throw, not fall back to the committed dev constant.
        AssertBootRefused(BootProduction(), "Jwt:Key");
    }

    [Fact]
    public void Production_boot_with_the_dev_constant_key_fails_loudly()
    {
        AssertBootRefused(
            BootProduction(
                ("Jwt:Key", JwtStartupValidation.DevFallbackKey),
                ("Jwt:Issuer", RealIssuer),
                ("Jwt:Audience", RealAudience)),
            "dev-only fallback key");
    }

    [Fact]
    public void Production_boot_with_dev_constant_issuer_or_audience_fails_loudly()
    {
        AssertBootRefused(
            BootProduction(
                ("Jwt:Key", RealKey),
                ("Jwt:Issuer", JwtStartupValidation.DevFallbackIssuer),
                ("Jwt:Audience", RealAudience)),
            "Jwt:Issuer");

        AssertBootRefused(
            BootProduction(
                ("Jwt:Key", RealKey),
                ("Jwt:Issuer", RealIssuer),
                ("Jwt:Audience", JwtStartupValidation.DevFallbackAudience)),
            "Jwt:Audience");
    }

    [Fact]
    public void Production_boot_without_issuer_or_audience_fails_loudly()
    {
        AssertBootRefused(
            BootProduction(("Jwt:Key", RealKey)),
            "Jwt:Issuer");

        AssertBootRefused(
            BootProduction(("Jwt:Key", RealKey), ("Jwt:Issuer", RealIssuer)),
            "Jwt:Audience");
    }

    [Fact]
    public void Production_boot_with_a_short_key_fails_loudly()
    {
        AssertBootRefused(
            BootProduction(
                ("Jwt:Key", "too-short"),
                ("Jwt:Issuer", RealIssuer),
                ("Jwt:Audience", RealAudience)),
            "32 bytes");
    }

    [Fact]
    public void Production_boot_with_real_values_succeeds()
    {
        // The strict path must not break a correctly configured deployment.
        var exception = BootProduction(
            ("Jwt:Key", RealKey),
            ("Jwt:Issuer", RealIssuer),
            ("Jwt:Audience", RealAudience));

        Assert.Null(exception);
    }

    [Fact]
    public void Development_boot_keeps_the_zero_config_dev_stack_working()
    {
        // Development (the WebApplicationFactory default) stays relaxed so the
        // local/CI compose stack and the existing routing tests boot unchanged.
        // SF_SKIP_DB_INIT: Development boots attempt migrate/seed — skip it like
        // VerticalRoutingTests does (parallelization is disabled assembly-wide,
        // so the process-global env var cannot race another boot).
        Environment.SetEnvironmentVariable("SF_SKIP_DB_INIT", "1");
        try
        {
            using var factory = new WebApplicationFactory<Program>();
            Assert.Null(Record.Exception(() => _ = factory.Server));
        }
        finally
        {
            Environment.SetEnvironmentVariable("SF_SKIP_DB_INIT", null);
        }
    }
}
