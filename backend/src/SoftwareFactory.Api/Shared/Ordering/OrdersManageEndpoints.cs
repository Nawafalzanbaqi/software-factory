using MediatR;
using SoftwareFactory.Application.Common.Models;
using SoftwareFactory.Application.Shared.Ordering.Dtos;
using SoftwareFactory.Application.Shared.Ordering.Orders.Manage;

namespace SoftwareFactory.Api.Shared.Ordering;

public sealed record TransitionOrderStatusRequest(string Status);

/// <summary>
/// Staff order management for the client dashboard (Phase 4). Shared across
/// verticals like the rest of Shared/Ordering; mapped only when
/// features.clientDashboard is on and requires the dashboard-staff policy
/// (role owner|staff from the frontend-issued bearer JWT).
/// </summary>
public static class OrdersManageEndpoints
{
    /// <summary>Authorization policy name — registered in Program.cs.</summary>
    public const string StaffPolicy = "DashboardStaff";

    public static IEndpointRouteBuilder MapOrdersManage(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/manage/orders")
            .WithTags("OrdersManage")
            .RequireAuthorization(StaffPolicy);

        // Produces<T> makes the response schemas explicit in openapi.json — the
        // frontend dashboard generates its types from this document (npm run gen:api).
        group.MapGet("", async (int? page, int? pageSize, string? status, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new ListAllOrdersQuery(page ?? 1, pageSize ?? 20, status), ct)))
            .WithName("ListAllOrders")
            .WithSummary("List every order in the store (dashboard staff).")
            .Produces<PagedResult<OrderDto>>();

        group.MapGet("/{orderNumber}", async (string orderNumber, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetManagedOrderQuery(orderNumber), ct)))
            .WithName("GetManagedOrder")
            .WithSummary("Full staff-facing detail for one order.")
            .Produces<ManagedOrderDto>();

        group.MapPost("/{orderNumber}/status", async (string orderNumber, TransitionOrderStatusRequest body, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new TransitionOrderStatusCommand(orderNumber, body.Status), ct)))
            .WithName("TransitionOrderStatus")
            .WithSummary("Advance an order's lifecycle status.")
            .Produces<ManagedOrderDto>();

        return app;
    }
}
