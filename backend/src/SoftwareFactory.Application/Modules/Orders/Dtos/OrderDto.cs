using SoftwareFactory.Domain.Modules.Orders;

namespace SoftwareFactory.Application.Modules.Orders.Dtos;

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
            i.ProductId, i.ProductNameEn, i.ProductNameAr, i.UnitPrice.Amount, i.Quantity, i.LineTotal.Amount)).ToList(),
        order.Total.Amount,
        order.Currency,
        order.CreatedAtUtc);

    public static OrderTrackingDto ToTrackingDto(this Order order) => new(
        order.OrderNumber,
        order.Status.ToString(),
        order.Timeline.OrderBy(t => t.At)
            .Select(t => new OrderTimelinePointDto(t.Status.ToString(), t.At)).ToList());
}
