using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering.Dtos;

/// <summary>
/// Staff-facing order projection for the client dashboard
/// (features.clientDashboard, Phase 4). Additive: the public OrderDto /
/// OrderTrackingDto wire shapes stay frozen — this DTO adds the customer,
/// payment and fulfillment context a store operator needs. Fulfillment is
/// exposed as the pair of optional owned VOs (exactly one set per order).
/// </summary>
public sealed record ManagedOrderShippingAddressDto(
    string Line,
    string? City,
    string? Country);

public sealed record ManagedOrderFulfillmentDto(
    string Type,
    Guid? BranchId,
    Guid? TableId,
    DateTimeOffset? ScheduledFor,
    string? DeliveryAddress);

public sealed record ManagedOrderDto(
    string OrderNumber,
    string Status,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string PaymentMethod,
    IReadOnlyList<OrderItemDto> Items,
    decimal Total,
    string Currency,
    DateTimeOffset PlacedAt,
    IReadOnlyList<OrderTimelinePointDto> Timeline,
    ManagedOrderShippingAddressDto? ShippingAddress,
    ManagedOrderFulfillmentDto? Fulfillment);

public static class ManagedOrderMapping
{
    public static ManagedOrderDto ToManagedDto(this Order order) => new(
        order.OrderNumber,
        order.Status.ToString(),
        order.CustomerName,
        order.CustomerEmail,
        order.CustomerPhone,
        order.PaymentMethod,
        order.Items.Select(i => new OrderItemDto(
            i.ItemId, i.NameEn, i.NameAr, i.UnitPrice.Amount, i.Quantity, i.LineTotal.Amount)).ToList(),
        order.Total.Amount,
        order.Currency,
        order.CreatedAtUtc,
        order.Timeline.OrderBy(t => t.At)
            .Select(t => new OrderTimelinePointDto(t.Status.ToString(), t.At)).ToList(),
        order.ShippingAddress is { } address
            ? new ManagedOrderShippingAddressDto(address.Line, address.City, address.Country)
            : null,
        order.Fulfillment is { } fulfillment
            ? new ManagedOrderFulfillmentDto(
                fulfillment.Type.ToString(),
                fulfillment.BranchId,
                fulfillment.TableId,
                fulfillment.ScheduledFor,
                fulfillment.DeliveryAddress)
            : null);
}
