using MediatR;
using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Events;
using SoftwareFactory.Application.Common.Integrations;
using SoftwareFactory.Domain.Modules.Orders.Events;

namespace SoftwareFactory.Application.Modules.Orders.EventHandlers;

/// <summary>
/// Reacts to <see cref="OrderPlacedDomainEvent"/> after checkout is committed.
/// Phase 1: logs + fires (no-op) notification / e-invoice hooks.
/// </summary>
public sealed class OrderPlacedEventHandler
    : INotificationHandler<DomainEventNotification<OrderPlacedDomainEvent>>
{
    private readonly ILogger<OrderPlacedEventHandler> _logger;
    private readonly INotificationService _notifications;
    private readonly IEInvoiceService _eInvoice;

    public OrderPlacedEventHandler(
        ILogger<OrderPlacedEventHandler> logger,
        INotificationService notifications,
        IEInvoiceService eInvoice)
    {
        _logger = logger;
        _notifications = notifications;
        _eInvoice = eInvoice;
    }

    public async Task Handle(DomainEventNotification<OrderPlacedDomainEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;
        _logger.LogInformation(
            "Order {OrderNumber} placed for {Total} {Currency}", e.OrderNumber, e.Total, e.Currency);

        // TODO (backlog): OUT OF SCOPE — WhatsApp/email confirmation.
        await _notifications.NotifyOrderPlacedAsync(e.OrderNumber, e.CustomerEmail, e.Total, e.Currency, cancellationToken);

        // TODO (backlog): OUT OF SCOPE — ZATCA e-invoice generation.
        await _eInvoice.GenerateForOrderAsync(e.OrderNumber, cancellationToken);
    }
}
