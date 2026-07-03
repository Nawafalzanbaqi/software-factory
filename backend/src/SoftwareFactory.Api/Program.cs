using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SoftwareFactory.Api.Identity;
using SoftwareFactory.Api.Middleware;
using SoftwareFactory.Api.Modules.Catalog;
using SoftwareFactory.Api.Modules.Contact;
using SoftwareFactory.Api.Modules.Ecommerce;
using SoftwareFactory.Api.Modules.Restaurant;
using SoftwareFactory.Api.Modules.Reviews;
using SoftwareFactory.Api.Modules.Search;
using SoftwareFactory.Api.Modules.Wishlist;
using SoftwareFactory.Api.Shared.Ordering;
using SoftwareFactory.Application;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Infrastructure;
using SoftwareFactory.Infrastructure.Seed;
using Swashbuckle.AspNetCore.Swagger;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Application + Infrastructure (CQRS, EF Core, Redis, options.json manifest)
// ---------------------------------------------------------------------------
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// ---------------------------------------------------------------------------
// Global exception handling -> ProblemDetails
// ---------------------------------------------------------------------------
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ---------------------------------------------------------------------------
// AuthN/AuthZ — Phase 1 bearer JWT (symmetric key from config). FAIL-CLOSED:
// outside Development the key/issuer/audience must be real (non-dev-constant)
// values and issuer/audience validation is forced on — JwtStartupValidation
// throws at boot otherwise, so a misconfigured deployment never accepts
// forgeable tokens. Resolved HERE (not inside the deferred options lambda) so
// the boot itself fails, loudly.
// TODO (backlog): wire real Auth.js / NextAuth JWKS validation
// (Authority + /.well-known/jwks.json) and drop the shared symmetric key.
// ---------------------------------------------------------------------------
var jwt = builder.Configuration.GetSection("Jwt");
var jwtOptions = JwtStartupValidation.Resolve(
    jwt["Key"], jwt["Issuer"], jwt["Audience"], builder.Environment.IsDevelopment());
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        // Keep raw JWT claim names ("sub"/"email"/"role") instead of the legacy
        // SOAP-era remapping, so NameClaimType/RoleClaimType below match what
        // the frontend actually mints (Phase 4 dashboard bearer).
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = jwtOptions.ValidateIssuer,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = jwtOptions.ValidateAudience,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            NameClaimType = "sub",
            // Phase 4: the frontend-issued JWT carries the dashboard role
            // (owner|staff) in a plain "role" claim.
            RoleClaimType = "role"
        };
    });
builder.Services.AddAuthorization(options =>
    // Client-dashboard staff surface (Phase 4). The frontend role model treats
    // `admin` (factory operator) as a superset of the dashboard roles — keep
    // the policy in lock-step with features/dashboard/lib/access.ts.
    options.AddPolicy(OrdersManageEndpoints.StaffPolicy, policy =>
        policy.RequireRole("admin", "owner", "staff")));

// ---------------------------------------------------------------------------
// CORS — origins from Cors:AllowedOrigins (comma or array).
// ---------------------------------------------------------------------------
var corsOrigins = ReadOrigins(builder.Configuration);
const string CorsPolicy = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ---------------------------------------------------------------------------
// Rate limiting — fixed window on public endpoints (values from config).
// ---------------------------------------------------------------------------
var permit = builder.Configuration.GetValue("RateLimiting:PermitPerWindow", 100);
var windowSeconds = builder.Configuration.GetValue("RateLimiting:WindowSeconds", 60);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("public", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permit,
                Window = TimeSpan.FromSeconds(windowSeconds),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

// ---------------------------------------------------------------------------
// OpenAPI / Swagger (Swashbuckle)
// ---------------------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Software Factory API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a JWT bearer token."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

// ---------------------------------------------------------------------------
// Middleware pipeline
// ---------------------------------------------------------------------------
app.UseExceptionHandler();
app.UseSecurityHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();

// ---------------------------------------------------------------------------
// Endpoint modules — mapped ONLY when their feature/section is enabled.
// (Code for disabled modules still ships; it is just not registered.)
// ---------------------------------------------------------------------------
var features = app.Services.GetRequiredService<IFeatureManager>();
var isEcommerce = features.IsVertical("ecommerce");
var isRestaurant = features.IsVertical("restaurant");

// --- Shared modules (registered for BOTH verticals, as enabled) ---
app.MapCart();

if (features.IsSectionEnabled("contact"))
{
    app.MapContact();
}

if (features.IsFeatureEnabled("orderTracking"))
{
    app.MapOrderTracking();
}

// Client dashboard (Phase 4): staff order management, both verticals.
// Flag off => routes not mapped (404), absent from OpenAPI.
if (features.IsFeatureEnabled("clientDashboard"))
{
    app.MapOrdersManage();
}

// Reviews is OFF by default; shared across verticals when enabled.
if (features.IsFeatureEnabled("reviews"))
{
    app.MapReviews();
}

// --- E-commerce vertical modules (siteType=ecommerce) ---
if (isEcommerce)
{
    app.MapCatalog();
    app.MapEcommerceCheckout();

    if (features.IsFeatureEnabled("wishlist"))
    {
        app.MapWishlist();
    }

    if (features.IsFeatureEnabled("search"))
    {
        app.MapSearch(); // product search
    }
}

// --- Restaurant vertical modules (siteType=restaurant) ---
if (isRestaurant)
{
    app.MapMenu();
    app.MapBranches();
    app.MapReservations();
    app.MapRestaurantCheckout();

    if (features.IsFeatureEnabled("search"))
    {
        app.MapRestaurantSearch(); // menu-item search
    }
}

// ---------------------------------------------------------------------------
// Startup work: apply schema + seed enabled modules; emit openapi.json (dev).
// ---------------------------------------------------------------------------
// Honor SF_SKIP_DB_INIT=1 so a WebApplicationFactory test can boot and assert
// the registered endpoint set without a running Postgres.
var skipDbInit = Environment.GetEnvironmentVariable("SF_SKIP_DB_INIT") == "1";

if (app.Environment.IsDevelopment())
{
    if (!skipDbInit)
    {
        try
        {
            await DbSeeder.MigrateAndSeedAsync(app.Services);
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Database migrate/seed skipped (is Postgres running?).");
        }

        // Emit openapi.json AFTER the pipeline is built so the endpoint data source
        // (and therefore ApiExplorer) is fully populated.
        app.Lifetime.ApplicationStarted.Register(() => EmitOpenApiDocument(app));
    }
}

app.Run();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
static string[] ReadOrigins(IConfiguration config)
{
    var array = config.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (array is { Length: > 0 })
    {
        return array;
    }

    var csv = config["Cors:AllowedOrigins"];
    return string.IsNullOrWhiteSpace(csv)
        ? new[] { "http://localhost:3000" }
        : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

static void EmitOpenApiDocument(WebApplication app)
{
    try
    {
        var provider = app.Services.GetRequiredService<ISwaggerProvider>();
        var doc = provider.GetSwagger("v1");
        using var stringWriter = new StringWriter();
        var writer = new Microsoft.OpenApi.Writers.OpenApiJsonWriter(stringWriter);
        doc.SerializeAsV3(writer);
        var path = Path.Combine(app.Environment.ContentRootPath, "openapi.json");
        File.WriteAllText(path, stringWriter.ToString());
        app.Logger.LogInformation("openapi.json written to {Path}", path);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Failed to emit openapi.json.");
    }
}

/// <summary>Exposed for WebApplicationFactory-based integration tests.</summary>
public partial class Program;
