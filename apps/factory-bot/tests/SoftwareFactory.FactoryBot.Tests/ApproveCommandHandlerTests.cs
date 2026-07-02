using NSubstitute;
using SoftwareFactory.FactoryBot.Commands;
using SoftwareFactory.FactoryBot.Commands.Handlers;
using SoftwareFactory.FactoryBot.Models;
using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;
using Xunit;

namespace SoftwareFactory.FactoryBot.Tests;

public class ApproveCommandHandlerTests
{
    private readonly IPlatformApiClient _api = Substitute.For<IPlatformApiClient>();
    private readonly IMessageSender _sender = Substitute.For<IMessageSender>();
    private readonly CommandParser _parser = new();

    private ApproveCommandHandler CreateHandler() => new(_api, _sender);

    [Fact]
    public async Task Approve_calls_platform_api_with_right_args()
    {
        var projectId = Guid.NewGuid();
        _api.ApproveGateAsync(projectId, "Security", "@nawaf", null, Arg.Any<CancellationToken>())
            .Returns(new ApprovalGateDto(
                Guid.NewGuid(), projectId, "Security", "@nawaf", DateTimeOffset.UtcNow, null, true));

        var parsed = _parser.Parse($"/approve Security {projectId}");
        var request = new CommandRequest(parsed, ChatId: 42, RequestedBy: "@nawaf");

        await CreateHandler().HandleAsync(request);

        await _api.Received(1).ApproveGateAsync(
            projectId, "Security", "@nawaf", null, Arg.Any<CancellationToken>());
        await _sender.Received(1).SendMessageAsync(
            42, Arg.Is<string>(s => s.Contains("Approved") && s.Contains("Security")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Approve_normalizes_gate_casing_to_canonical()
    {
        var projectId = Guid.NewGuid();
        _api.ApproveGateAsync(projectId, "Architecture", "@x", null, Arg.Any<CancellationToken>())
            .Returns(new ApprovalGateDto(
                Guid.NewGuid(), projectId, "Architecture", "@x", DateTimeOffset.UtcNow, null, true));

        var parsed = _parser.Parse($"/approve architecture {projectId}");
        var request = new CommandRequest(parsed, 1, "@x");

        await CreateHandler().HandleAsync(request);

        await _api.Received(1).ApproveGateAsync(
            projectId, "Architecture", "@x", null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Invalid_gate_does_not_call_api_and_shows_usage()
    {
        var parsed = _parser.Parse($"/approve Nope {Guid.NewGuid()}");
        var request = new CommandRequest(parsed, 7, "@x");

        await CreateHandler().HandleAsync(request);

        await _api.DidNotReceiveWithAnyArgs().ApproveGateAsync(
            default, default!, default!, default, default);
        await _sender.Received(1).SendMessageAsync(
            7, Arg.Is<string>(s => s.Contains("Usage")), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Invalid_guid_does_not_call_api()
    {
        var parsed = _parser.Parse("/approve Deploy not-a-guid");
        var request = new CommandRequest(parsed, 7, "@x");

        await CreateHandler().HandleAsync(request);

        await _api.DidNotReceiveWithAnyArgs().ApproveGateAsync(
            default, default!, default!, default, default);
    }
}
