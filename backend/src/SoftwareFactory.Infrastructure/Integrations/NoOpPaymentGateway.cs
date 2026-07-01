using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Integrations;

namespace SoftwareFactory.Infrastructure.Integrations;

/// <summary>
/// Phase 1 no-op payment gateway — always accepts.
/// TODO (backlog): OUT OF SCOPE — replace with real Tamara/Tabby clients
/// (create session, redirect URL, webhook verification). Do not add external
/// HTTP calls in Phase 1.
/// </summary>
public sealed class NoOpPaymentGateway : IPaymentGateway
{
    private readonly ILogger<NoOpPaymentGateway> _logger;

    public NoOpPaymentGateway(ILogger<NoOpPaymentGateway> logger) => _logger = logger;

    public Task<PaymentInitResult> InitiateAsync(
        string orderNumber,
        decimal amount,
        string currency,
        string method,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[stub] Payment initiated for {OrderNumber} ({Amount} {Currency}) via {Method}",
            orderNumber, amount, currency, method);

        return Task.FromResult(new PaymentInitResult(true, RedirectUrl: null, ProviderReference: $"stub-{orderNumber}"));
    }
}
