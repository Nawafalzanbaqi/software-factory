using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using Xunit;

namespace SoftwareFactory.Platform.Application.Tests;

public class ClientServiceTests
{
    [Fact]
    public async Task CreateClient_persists_and_returns_dto()
    {
        using var h = new TestHarness();

        var dto = await h.Clients.CreateClientAsync(
            new CreateClientRequest("Acme Corp", "hi@acme.test", "VIP"));

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Acme Corp", dto.Name);
        Assert.Equal("hi@acme.test", dto.ContactEmail);

        var all = await h.Clients.GetClientsAsync();
        Assert.Single(all);

        var fetched = await h.Clients.GetClientAsync(dto.Id);
        Assert.NotNull(fetched);
        Assert.Equal(dto.Id, fetched!.Id);
    }

    [Fact]
    public async Task CreateClient_rejects_blank_name()
    {
        using var h = new TestHarness();

        await Assert.ThrowsAsync<ValidationException>(() =>
            h.Clients.CreateClientAsync(new CreateClientRequest("   ", null, null)));
    }
}
