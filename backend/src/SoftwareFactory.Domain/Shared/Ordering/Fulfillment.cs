using SoftwareFactory.Domain.Common;

namespace SoftwareFactory.Domain.Shared.Ordering;

/// <summary>How a restaurant food order is fulfilled.</summary>
public enum FulfillmentType
{
    DineIn = 0,
    Pickup = 1,
    Delivery = 2
}

/// <summary>
/// Optional restaurant fulfillment metadata for an order. Owned, nullable value
/// object — only set for food orders. E-commerce orders use
/// <see cref="ShippingAddress"/> instead. Only one of the two is set per order.
/// </summary>
public sealed class Fulfillment : ValueObject
{
    public FulfillmentType Type { get; }

    /// <summary>Branch the order is served from (dine-in / pickup / delivery origin).</summary>
    public Guid? BranchId { get; }

    /// <summary>Table for a dine-in order.</summary>
    public Guid? TableId { get; }

    /// <summary>Scheduled pickup / delivery time (null = as soon as possible).</summary>
    public DateTimeOffset? ScheduledFor { get; }

    /// <summary>Free-form delivery address for a delivery order.</summary>
    public string? DeliveryAddress { get; }

    public Fulfillment(
        FulfillmentType type,
        Guid? branchId = null,
        Guid? tableId = null,
        DateTimeOffset? scheduledFor = null,
        string? deliveryAddress = null)
    {
        Type = type;
        BranchId = branchId;
        TableId = tableId;
        ScheduledFor = scheduledFor;
        DeliveryAddress = deliveryAddress;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Type;
        yield return BranchId;
        yield return TableId;
        yield return ScheduledFor;
        yield return DeliveryAddress;
    }
}
