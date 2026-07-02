using SoftwareFactory.Platform.Domain.Common;

namespace SoftwareFactory.Platform.Domain.Entities;

/// <summary>A factory customer who owns one or more projects.</summary>
public class Client : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
