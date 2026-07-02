namespace SoftwareFactory.Platform.Application.Common;

/// <summary>Thrown when a referenced aggregate does not exist. Maps to HTTP 404.</summary>
public sealed class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }

    public static NotFoundException For(string entity, Guid id) =>
        new($"{entity} '{id}' was not found.");
}

/// <summary>Thrown on failed guard-clause validation. Maps to HTTP 400.</summary>
public sealed class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
