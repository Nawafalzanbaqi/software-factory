using System.Text.Json;
using System.Text.Json.Serialization;
using SoftwareFactory.Platform.Api.Endpoints;
using SoftwareFactory.Platform.Api.Infrastructure;
using SoftwareFactory.Platform.Infrastructure;
using SoftwareFactory.Platform.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Default to :5090 unless ASPNETCORE_URLS is provided by the environment.
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
    builder.WebHost.UseUrls("http://localhost:5090");

const string LocalCorsPolicy = "localhost";
builder.Services.AddCors(options =>
{
    options.AddPolicy(LocalCorsPolicy, policy => policy
        .SetIsOriginAllowed(origin =>
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
            return uri.Host is "localhost" or "127.0.0.1";
        })
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// Enum-as-string JSON so "ci"/"manual"/"intake" etc. match the contract.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();

// OpenAPI document at /openapi/v1.json — the factory-dashboard derives its
// platform types from it (apps/factory-dashboard: npm run gen:platform-api).
builder.Services.AddOpenApi();

// EF Core (Npgsql) + repositories + NoOp analytics + application services. Secrets from env.
builder.Services.AddPlatformInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseCors(LocalCorsPolicy);

app.MapGet("/health", () => Results.Ok(new { status = "healthy" })).WithTags("Health");
app.MapOpenApi();

app.MapClientEndpoints();
app.MapProjectEndpoints();
app.MapIntakeEndpoints();
app.MapDeploymentEndpoints();
app.MapAnalyticsEndpoints();

// Guarded migrate/seed; honors PLATFORM_SKIP_DB_INIT=1 (also skipped by tests via WebApplicationFactory).
await PlatformDbInitializer.InitializeAsync(app.Services);

app.Run();

// TODO(phase-4): real admin authn/z, multi-tenant/white-label, real Umami/LiteLLM analytics.

/// <summary>Exposed so integration tests can spin up the API with WebApplicationFactory.</summary>
public partial class Program { }
