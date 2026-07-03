using System.Text;

namespace SoftwareFactory.Api.Identity;

/// <summary>
/// FAIL-CLOSED resolution of the bearer-JWT signing config (security audit
/// fix #1). Development keeps the zero-config local/CI stack: the committed
/// dev constants (mirrored by the frontend's lib/auth/backend-token.ts and
/// appsettings.Development.json) are acceptable there. Outside Development the
/// key, issuer and audience MUST be configured via env/config, MUST NOT be the
/// committed dev constants, and issuer/audience validation is always enforced
/// — otherwise the boot fails loudly instead of accepting forgeable tokens.
/// </summary>
public static class JwtStartupValidation
{
    /// <summary>Committed dev-only constants — rejected outside Development.</summary>
    public const string DevFallbackKey = "dev-only-insecure-signing-key-change-me-32bytes!";
    public const string DevFallbackIssuer = "software-factory";
    public const string DevFallbackAudience = "software-factory-web";

    /// <summary>HS256 needs a 256-bit key; anything shorter is brute-forceable.</summary>
    private const int MinKeyBytes = 32;

    public sealed record ResolvedJwtOptions(
        string Key,
        string? Issuer,
        string? Audience,
        bool ValidateIssuer,
        bool ValidateAudience);

    public static ResolvedJwtOptions Resolve(
        string? key,
        string? issuer,
        string? audience,
        bool isDevelopment)
    {
        if (isDevelopment)
        {
            // appsettings.Development.json supplies the dev constants; the code
            // fallback only covers test hosts booting without those files.
            return new ResolvedJwtOptions(
                string.IsNullOrWhiteSpace(key) ? DevFallbackKey : key,
                issuer,
                audience,
                ValidateIssuer: !string.IsNullOrWhiteSpace(issuer),
                ValidateAudience: !string.IsNullOrWhiteSpace(audience));
        }

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "Jwt:Key is not configured. Outside Development the API refuses to boot " +
                "without a real signing key (32+ bytes; set Jwt__Key, identical to the " +
                "frontend's BACKEND_JWT_KEY).");
        }

        if (key == DevFallbackKey)
        {
            throw new InvalidOperationException(
                "Jwt:Key is the committed dev-only fallback key. Outside Development this " +
                "would make every bearer forgeable from the public repo — set a real Jwt__Key.");
        }

        if (Encoding.UTF8.GetByteCount(key) < MinKeyBytes)
        {
            throw new InvalidOperationException(
                $"Jwt:Key is shorter than {MinKeyBytes} bytes — too weak for HS256. " +
                "Generate one with: openssl rand -base64 32.");
        }

        if (string.IsNullOrWhiteSpace(issuer))
        {
            throw new InvalidOperationException(
                "Jwt:Issuer is not configured. Outside Development issuer validation is " +
                "mandatory — set Jwt__Issuer (and BACKEND_JWT_ISSUER on the frontend).");
        }

        if (issuer == DevFallbackIssuer)
        {
            throw new InvalidOperationException(
                "Jwt:Issuer is the committed dev-only constant. Outside Development set a " +
                "deployment-specific Jwt__Issuer (and BACKEND_JWT_ISSUER on the frontend).");
        }

        if (string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException(
                "Jwt:Audience is not configured. Outside Development audience validation is " +
                "mandatory — set Jwt__Audience (and BACKEND_JWT_AUDIENCE on the frontend).");
        }

        if (audience == DevFallbackAudience)
        {
            throw new InvalidOperationException(
                "Jwt:Audience is the committed dev-only constant. Outside Development set a " +
                "deployment-specific Jwt__Audience (and BACKEND_JWT_AUDIENCE on the frontend).");
        }

        return new ResolvedJwtOptions(key, issuer, audience, ValidateIssuer: true, ValidateAudience: true);
    }
}
