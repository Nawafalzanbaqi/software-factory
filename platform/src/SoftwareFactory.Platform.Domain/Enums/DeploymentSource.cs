namespace SoftwareFactory.Platform.Domain.Enums;

/// <summary>Origin of a deployment event. JSON: "ci" | "manual".</summary>
public enum DeploymentSource
{
    Ci,
    Manual
}
