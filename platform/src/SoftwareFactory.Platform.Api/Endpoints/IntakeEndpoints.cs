using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Dtos;

namespace SoftwareFactory.Platform.Api.Endpoints;

public static class IntakeEndpoints
{
    public static IEndpointRouteBuilder MapIntakeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/intake").WithTags("Intake");

        // Static catalog the "New Project" form renders from: site types, the valid
        // section list per site type (core sections flagged), payments, integrations,
        // features, and per-siteType recommendations (e.g. ZATCA for KSA ecommerce).
        group.MapGet("/catalog", (IProjectService svc)
            => Results.Ok(svc.GetIntakeCatalog()))
            .Produces<IntakeCatalogDto>();

        return app;
    }
}
