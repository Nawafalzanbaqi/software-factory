namespace SoftwareFactory.Application.Common.Exceptions;

/// <summary>
/// Thrown when a requested resource does not exist. Mapped to HTTP 404 by
/// the API global exception handler.
/// </summary>
public sealed class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string entity, object key)
        : base($"{entity} '{key}' was not found.") { }
}
