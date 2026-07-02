namespace SoftwareFactory.Platform.Api.Infrastructure;

/// <summary>Adds baseline security headers to every response.</summary>
public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        headers["X-XSS-Protection"] = "0";
        headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
        await _next(context);
    }
}
