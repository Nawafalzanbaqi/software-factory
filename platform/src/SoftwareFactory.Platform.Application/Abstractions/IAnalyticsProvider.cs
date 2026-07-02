using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Application.Abstractions;

/// <summary>
/// Analytics port. Mirrors the client backend's IPaymentGateway/NoOp provider pattern.
/// The Phase 3 implementation is <c>NoOpAnalyticsProvider</c>.
/// TODO(phase-4): real Umami/LiteLLM-backed provider.
/// </summary>
public interface IAnalyticsProvider
{
    Task<AnalyticsDto> GetAnalyticsAsync(Guid projectId, CancellationToken ct = default);
}
