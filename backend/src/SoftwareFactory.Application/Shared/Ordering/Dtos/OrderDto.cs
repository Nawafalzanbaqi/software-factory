using SoftwareFactory.Domain.Shared.Ordering;

namespace SoftwareFactory.Application.Shared.Ordering.Dtos;

/// <summary>
/// Order line DTO. Wire-compat: the field stays named <c>ProductId</c> (the
/// generic catalog-item id) so the Phase 1 REST contract stays byte-identical.
/// </summary>
public sealed record OrderItemDto(
    Guid ProductId,
    string NameEn,
    string NameAr,
    decimal Price,
    int Quantity,
    decimal LineTotal);

public sealed record OrderDto(
    string OrderNumber,
    string Status,
    IReadOnlyList<OrderItemDto> Items,
    decimal Total,
    string Currency,
    DateTimeOffset PlacedAt);

public sealed record OrderTimelinePointDto(string Status, DateTimeOffset At);

public sealed record OrderTrackingDto(
    string OrderNumber,
    string Status,
    IReadOnlyList<OrderTimelinePointDto> Timeline);

public static class OrderMapping
{
    public static OrderDto ToDto(this Order order) => new(
        order.OrderNumber,
        order.Status.ToString(),
        order.Items.Select(i => new OrderItemDto(
            i.ItemId, i.NameEn, i.NameAr, i.UnitPrice.Amount, i.Quantity, i.LineTotal.Amount)).ToList(),
        order.Total.Amount,
        order.Currency,
        order.CreatedAtUtc);

    public static OrderTrackingDto ToTrackingDto(this Order order) => new(
        order.OrderNumber,
        order.Status.ToString(),
        order.Timeline.OrderBy(t => t.At)
            .Select(t => new OrderTimelinePointDto(t.Status.ToString(), t.At)).ToList());
}
