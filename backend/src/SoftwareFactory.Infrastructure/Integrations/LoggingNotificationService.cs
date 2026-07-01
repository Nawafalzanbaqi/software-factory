using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Integrations;

namespace SoftwareFactory.Infrastructure.Integrations;

/// <summary>
/// Phase 1 no-op notifications (logs only).
/// TODO (backlog): OUT OF SCOPE — WhatsApp Business API + transactional email.
/// </summary>
public sealed class LoggingNotificationService : INotificationService
{
    private readonly ILogger<LoggingNotificationService> _logger;

    public LoggingNotificationService(ILogger<LoggingNotificationService> logger) => _logger = logger;

    public Task NotifyOrderPlacedAsync(
        string orderNumber,
        string customerEmail,
        decimal total,
        string currency,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[stub] Would notify {Email} that order {OrderNumber} ({Total} {Currency}) was placed.",
            customerEmail, orderNumber, total, currency);

        return Task.CompletedTask;
    }
}
