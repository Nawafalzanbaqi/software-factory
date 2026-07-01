namespace SoftwareFactory.Application.Common.Integrations;

/// <summary>
/// E-invoicing hook.
/// TODO (backlog): OUT OF SCOPE (Phase 1). Implement ZATCA (Fatoora) Phase 2
/// e-invoice generation + clearance/reporting. Phase 1 ships a no-op.
/// </summary>
public interface IEInvoiceService
{
    Task GenerateForOrderAsync(string orderNumber, CancellationToken cancellationToken = default);
}
