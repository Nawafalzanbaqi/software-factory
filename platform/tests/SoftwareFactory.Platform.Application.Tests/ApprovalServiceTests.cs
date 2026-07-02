using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Enums;
using Xunit;

namespace SoftwareFactory.Platform.Application.Tests;

public class ApprovalServiceTests
{
    [Fact]
    public async Task RecordApproval_sets_who_and_when()
    {
        using var h = new TestHarness();
        var client = await h.Clients.CreateClientAsync(new CreateClientRequest("Client", null, null));
        var project = await h.Projects.CreateProjectAsync(
            new CreateProjectRequest(client.Id, "Store", "ecommerce", null, null));

        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        var gate = await h.Approvals.RecordApprovalAsync(project.Id,
            new CreateApprovalRequest(GateType.Security, "nawaf@factory.test", "looks good"));

        Assert.True(gate.IsApproved);
        Assert.Equal(GateType.Security, gate.GateType);
        Assert.Equal("nawaf@factory.test", gate.ApprovedBy);
        Assert.NotNull(gate.ApprovedAt);
        Assert.True(gate.ApprovedAt >= before);
        Assert.Equal("looks good", gate.Notes);

        // Other gates remain unapproved.
        var detail = await h.Projects.GetProjectDetailAsync(project.Id);
        Assert.Equal(1, detail!.Gates.Count(g => g.IsApproved));
    }
}
