using Microsoft.Extensions.Logging;
using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Infrastructure.Analytics;

/// <summary>
/// Phase 3 no-op analytics provider — always returns empty/zeroed metrics with provider:"noop".
/// Mirrors the client backend's NoOpPaymentGateway pattern.
/// TODO(phase-4): replace with a real Umami/LiteLLM-backed provider (HTTP calls out of scope now).
/// </summary>
public sealed class NoOpAnalyticsProvider : IAnalyticsProvider
{
    private readonly ILogger<NoOpAnalyticsProvider> _logger;

    public NoOpAnalyticsProvider(ILogger<NoOpAnalyticsProvider> logger) => _logger = logger;

    public Task<AnalyticsDto> GetAnalyticsAsync(Guid projectId, CancellationToken ct = default)
    {
        _logger.LogInformation("[stub] Analytics requested for project {ProjectId}; returning noop zeros.", projectId);

        var dto = new AnalyticsDto(
            ProjectId: projectId,
            Provider: "noop",
            Visitors: 0,
            PageViews: 0,
            BounceRate: 0,
            Timeseries: Array.Empty<AnalyticsTimeseriesPointDto>());

        return Task.FromResult(dto);
    }
}
