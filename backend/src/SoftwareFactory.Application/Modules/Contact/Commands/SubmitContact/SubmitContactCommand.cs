using MediatR;

namespace SoftwareFactory.Application.Modules.Contact.Commands.SubmitContact;

/// <summary>POST /api/v1/contact  { name, email, message }.</summary>
public sealed record SubmitContactCommand(string Name, string Email, string Message) : IRequest<Guid>;
