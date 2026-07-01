namespace SoftwareFactory.Application.Common.Integrations;

/// <summary>
/// Outbound customer notifications.
/// TODO (backlog): OUT OF SCOPE (Phase 1). Wire WhatsApp Business API
/// (whatsapp token/phone id from env) + email. Phase 1 ships a no-op logger.
/// </summary>
public interface INotificationService
{
    Task NotifyOrderPlacedAsync(
        string orderNumber,
        string customerEmail,
        decimal total,
        string currency,
        CancellationToken cancellationToken = default);
}
