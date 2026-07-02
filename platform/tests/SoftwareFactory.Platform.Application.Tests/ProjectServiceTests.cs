using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Enums;
using Xunit;

namespace SoftwareFactory.Platform.Application.Tests;

public class ProjectServiceTests
{
    private static async Task<Guid> SeedClientAsync(TestHarness h)
    {
        var client = await h.Clients.CreateClientAsync(new CreateClientRequest("Client", null, null));
        return client.Id;
    }

    [Fact]
    public async Task CreateProject_seeds_three_unapproved_gates_and_intake_phase()
    {
        using var h = new TestHarness();
        var clientId = await SeedClientAsync(h);

        var project = await h.Projects.CreateProjectAsync(
            new CreateProjectRequest(clientId, "Store", "ecommerce", null, null));

        Assert.Equal(ProjectPhase.Intake, project.CurrentPhase);

        var detail = await h.Projects.GetProjectDetailAsync(project.Id);
        Assert.NotNull(detail);
        Assert.Equal(3, detail!.Gates.Count);
        Assert.All(detail.Gates, g => Assert.False(g.IsApproved));
        Assert.Contains(detail.Gates, g => g.GateType == GateType.Architecture);
        Assert.Contains(detail.Gates, g => g.GateType == GateType.Security);
        Assert.Contains(detail.Gates, g => g.GateType == GateType.Deploy);
    }

    [Fact]
    public async Task CreateProject_for_missing_client_throws_NotFound()
    {
        using var h = new TestHarness();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            h.Projects.CreateProjectAsync(new CreateProjectRequest(Guid.NewGuid(), "X", "ecommerce", null, null)));
    }

    [Fact]
    public async Task UpdatePhase_changes_current_phase()
    {
        using var h = new TestHarness();
        var clientId = await SeedClientAsync(h);
        var project = await h.Projects.CreateProjectAsync(
            new CreateProjectRequest(clientId, "Store", "ecommerce", null, null));

        var updated = await h.Projects.UpdatePhaseAsync(project.Id, ProjectPhase.Build);

        Assert.NotNull(updated);
        Assert.Equal(ProjectPhase.Build, updated!.CurrentPhase);
    }
}
