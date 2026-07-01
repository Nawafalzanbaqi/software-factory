namespace SoftwareFactory.Application.Common.Interfaces;

/// <summary>
/// Ambient accessor for the authenticated caller (from the bearer JWT).
/// </summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    /// <summary>The "sub" claim (stable user id), or null when anonymous.</summary>
    string? UserId { get; }

    /// <summary>The "email" claim, or null when unavailable.</summary>
    string? Email { get; }
}
