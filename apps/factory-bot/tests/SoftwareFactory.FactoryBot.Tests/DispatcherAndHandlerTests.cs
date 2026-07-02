using NSubstitute;
using SoftwareFactory.FactoryBot.Commands;
using SoftwareFactory.FactoryBot.Commands.Handlers;
using SoftwareFactory.FactoryBot.Models;
using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;
using Xunit;

namespace SoftwareFactory.FactoryBot.Tests;

public class DispatcherAndHandlerTests
{
    private readonly IPlatformApiClient _api = Substitute.For<IPlatformApiClient>();
    private readonly IMessageSender _sender = Substitute.For<IMessageSender>();
    private readonly CommandParser _parser = new();

    private CommandDispatcher CreateDispatcher() => new(
    [
        new ProjectsCommandHandler(_api, _sender),
        new StatusCommandHandler(_api, _sender),
        new ApproveCommandHandler(_api, _sender),
        new HelpCommandHandler(_sender),
    ]);

    [Fact]
    public async Task Unknown_command_falls_through_to_help()
    {
        var parsed = _parser.Parse("/wat");
        await CreateDispatcher().DispatchAsync(new CommandRequest(parsed, 9, "@x"));

        await _sender.Received(1).SendMessageAsync(
            9, HelpCommandHandler.HelpText, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Non_command_text_falls_through_to_help()
    {
        var parsed = _parser.Parse("just chatting");
        await CreateDispatcher().DispatchAsync(new CommandRequest(parsed, 9, "@x"));

        await _sender.Received(1).SendMessageAsync(
            9, HelpCommandHandler.HelpText, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Projects_command_lists_projects_with_phase()
    {
        _api.GetProjectsAsync(Arg.Any<CancellationToken>()).Returns(new List<ProjectDto>
        {
            new(Guid.NewGuid(), Guid.NewGuid(), "Acme Shop", "ecommerce", "Ship",
                null, null, null, DateTimeOffset.UtcNow),
        });

        var parsed = _parser.Parse("/projects");
        await CreateDispatcher().DispatchAsync(new CommandRequest(parsed, 3, "@x"));

        await _sender.Received(1).SendMessageAsync(
            3, Arg.Is<string>(s => s.Contains("Acme Shop") && s.Contains("Ship")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Projects_command_handles_empty_list()
    {
        _api.GetProjectsAsync(Arg.Any<CancellationToken>()).Returns(new List<ProjectDto>());

        var parsed = _parser.Parse("/projects");
        await CreateDispatcher().DispatchAsync(new CommandRequest(parsed, 3, "@x"));

        await _sender.Received(1).SendMessageAsync(
            3, Arg.Is<string>(s => s.Contains("No projects")), Arg.Any<CancellationToken>());
    }

    [Fact]
    public void Dispatcher_requires_help_handler()
    {
        Assert.Throws<InvalidOperationException>(() =>
            new CommandDispatcher([new ProjectsCommandHandler(_api, _sender)]));
    }

    [Fact]
    public void Deployment_event_formats_for_notification()
    {
        var evt = new DeploymentEventDto(
            Guid.NewGuid(), Guid.NewGuid(), "Failure", "Ci", null,
            DateTimeOffset.Parse("2026-01-01T00:00:00Z"));

        var text = SoftwareFactory.FactoryBot.Services.DeploymentNotifier.FormatEvent(evt);

        Assert.Contains("Failure", text);
        Assert.Contains("Ci", text);
        Assert.Contains(evt.ProjectId.ToString(), text);
    }
}
