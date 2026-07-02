using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Enums;
using Xunit;

namespace SoftwareFactory.Platform.Application.Tests;

public class UsageAndDeploymentTests
{
    private static async Task<Guid> SeedProjectAsync(TestHarness h)
    {
        var client = await h.Clients.CreateClientAsync(new CreateClientRequest("Client", null, null));
        var project = await h.Projects.CreateProjectAsync(
            new CreateProjectRequest(client.Id, "Store", "ecommerce", null, null));
        return project.Id;
    }

    [Fact]
    public async Task RecordUsage_accumulates_totals()
    {
        using var h = new TestHarness();
        var projectId = await SeedProjectAsync(h);

        await h.Usage.RecordUsageAsync(projectId, new CreateUsageRequest("claude-opus", 1000, 0.50m));
        await h.Usage.RecordUsageAsync(projectId, new CreateUsageRequest("claude-haiku", 2500, 0.10m));

        var summary = await h.Usage.GetUsageAsync(projectId);

        Assert.Equal(2, summary.Records.Count);
        Assert.Equal(3500, summary.TotalTokens);
        Assert.Equal(0.60m, summary.TotalCostUsd);
    }

    [Fact]
    public async Task RecordDeploymentEvent_is_returned_by_since_feed()
    {
        using var h = new TestHarness();
        var projectId = await SeedProjectAsync(h);
        var cutoff = DateTimeOffset.UtcNow.AddMinutes(-1);

        var evt = await h.Deployments.RecordDeploymentEventAsync(projectId,
            new CreateDeploymentRequest(DeploymentStatus.Success, DeploymentSource.Ci, "{\"run\":1}"));

        Assert.Equal(DeploymentStatus.Success, evt.Status);
        Assert.Equal(DeploymentSource.Ci, evt.Source);

        var perProject = await h.Deployments.GetProjectDeploymentsAsync(projectId);
        Assert.Single(perProject);

        var since = await h.Deployments.GetDeploymentsSinceAsync(cutoff);
        Assert.Single(since);
        Assert.Equal(evt.Id, since[0].Id);
    }
}
