using NSubstitute;
using SoftwareFactory.FactoryBot.Commands;
using SoftwareFactory.FactoryBot.Commands.Handlers;
using SoftwareFactory.FactoryBot.Models;
using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;
using Xunit;

namespace SoftwareFactory.FactoryBot.Tests;

public class StatusCommandHandlerTests
{
    private readonly IPlatformApiClient _api = Substitute.For<IPlatformApiClient>();
    private readonly IMessageSender _sender = Substitute.For<IMessageSender>();
    private readonly CommandParser _parser = new();

    [Fact]
    public async Task Status_formats_project_phase_and_gates()
    {
        var projectId = Guid.NewGuid();
        var detail = new ProjectDetailDto(
            new ProjectDto(projectId, Guid.NewGuid(), "Acme Shop", "ecommerce", "Build",
                null, null, null, DateTimeOffset.UtcNow),
            [
                new ApprovalGateDto(Guid.NewGuid(), projectId, "Architecture", "@lead",
                    DateTimeOffset.UtcNow, null, true),
                new ApprovalGateDto(Guid.NewGuid(), projectId, "Security", null, null, null, false),
            ],
            new UsageSummaryDto(12.5m, 1000),
            [
                new DeploymentEventDto(Guid.NewGuid(), projectId, "Success", "Ci", null,
                    DateTimeOffset.UtcNow),
            ]);
        _api.GetProjectAsync(projectId, Arg.Any<CancellationToken>()).Returns(detail);

        var parsed = _parser.Parse($"/status {projectId}");
        await new StatusCommandHandler(_api, _sender).HandleAsync(new CommandRequest(parsed, 5, "@x"));

        await _sender.Received(1).SendMessageAsync(
            5,
            Arg.Is<string>(s =>
                s.Contains("Acme Shop") &&
                s.Contains("Build") &&
                s.Contains("Architecture") &&
                s.Contains("Security") &&
                s.Contains("pending") &&
                s.Contains("Success")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Status_with_bad_id_shows_usage_and_skips_api()
    {
        var parsed = _parser.Parse("/status nope");
        await new StatusCommandHandler(_api, _sender).HandleAsync(new CommandRequest(parsed, 5, "@x"));

        await _api.DidNotReceiveWithAnyArgs().GetProjectAsync(default, default);
        await _sender.Received(1).SendMessageAsync(
            5, Arg.Is<string>(s => s.Contains("Usage")), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Status_reports_not_found()
    {
        var projectId = Guid.NewGuid();
        _api.GetProjectAsync(projectId, Arg.Any<CancellationToken>())
            .Returns((ProjectDetailDto?)null);

        var parsed = _parser.Parse($"/status {projectId}");
        await new StatusCommandHandler(_api, _sender).HandleAsync(new CommandRequest(parsed, 5, "@x"));

        await _sender.Received(1).SendMessageAsync(
            5, Arg.Is<string>(s => s.Contains("not found")), Arg.Any<CancellationToken>());
    }
}
