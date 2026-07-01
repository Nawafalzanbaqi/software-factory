namespace SoftwareFactory.Application.Common.Integrations;

/// <summary>
/// Abstraction over a payment provider (Tamara / Tabby / etc.).
/// TODO (backlog): OUT OF SCOPE (Phase 1). Implement real gateway calls
/// (tamara/tabi) — create checkout session, verify webhook signatures,
/// capture/refund. Do NOT implement external HTTP here in Phase 1.
/// </summary>
public interface IPaymentGateway
{
    Task<PaymentInitResult> InitiateAsync(
        string orderNumber,
        decimal amount,
        string currency,
        string method,
        CancellationToken cancellationToken = default);
}

public sealed record PaymentInitResult(bool Accepted, string? RedirectUrl, string? ProviderReference);
