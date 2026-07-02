using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SoftwareFactory.Platform.Application.Common;

namespace SoftwareFactory.Platform.Api.Infrastructure;

/// <summary>Maps application exceptions to RFC7807 ProblemDetails responses.</summary>
public sealed class AppExceptionHandler : IExceptionHandler
{
    private readonly ILogger<AppExceptionHandler> _logger;

    public AppExceptionHandler(ILogger<AppExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ValidationException => (StatusCodes.Status400BadRequest, "Validation failed"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        if (status == StatusCodes.Status500InternalServerError)
            _logger.LogError(ex, "Unhandled exception");

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = status == StatusCodes.Status500InternalServerError ? null : ex.Message,
            Type = $"https://httpstatuses.io/{status}"
        };

        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(problem, ct);
        return true;
    }
}
