using MediatR;
using SoftwareFactory.Application.Modules.Contact.Commands.SubmitContact;

namespace SoftwareFactory.Api.Modules.Contact;

public sealed record ContactRequest(string Name, string Email, string Message);

/// <summary>Contact module — public form submission endpoint.</summary>
public static class ContactEndpoints
{
    public static IEndpointRouteBuilder MapContact(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/contact", async (ContactRequest body, ISender sender, CancellationToken ct) =>
        {
            var id = await sender.Send(new SubmitContactCommand(body.Name, body.Email, body.Message), ct);
            return Results.Created($"/api/v1/contact/{id}", new { id });
        })
            .WithTags("Contact")
            .WithName("SubmitContact")
            .WithSummary("Submit a contact form message.")
            .RequireRateLimiting("public");

        return app;
    }
}
