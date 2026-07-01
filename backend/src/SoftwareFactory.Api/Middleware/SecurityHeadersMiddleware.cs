namespace SoftwareFactory.Api.Middleware;

/// <summary>
/// Adds baseline security headers to every response
/// (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
/// </summary>
public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers["X-Permitted-Cross-Domain-Policies"] = "none";
        headers["Cross-Origin-Opener-Policy"] = "same-origin";

        // API-only surface: lock CSP down hard (no inline/scripts served by the API).
        headers["Content-Security-Policy"] =
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

        if (context.Request.IsHttps)
        {
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        await _next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app) =>
        app.UseMiddleware<SecurityHeadersMiddleware>();
}
