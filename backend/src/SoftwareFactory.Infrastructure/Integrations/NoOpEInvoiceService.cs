using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Integrations;

namespace SoftwareFactory.Infrastructure.Integrations;

/// <summary>
/// Phase 1 no-op e-invoicing.
/// TODO (backlog): OUT OF SCOPE — ZATCA (Fatoora) Phase 2 e-invoice
/// generation, signing and clearance/reporting.
/// </summary>
public sealed class NoOpEInvoiceService : IEInvoiceService
{
    private readonly ILogger<NoOpEInvoiceService> _logger;

    public NoOpEInvoiceService(ILogger<NoOpEInvoiceService> logger) => _logger = logger;

    public Task GenerateForOrderAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[stub] Would generate ZATCA e-invoice for order {OrderNumber}.", orderNumber);
        return Task.CompletedTask;
    }
}
