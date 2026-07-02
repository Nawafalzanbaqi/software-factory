using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;

namespace SoftwareFactory.FactoryBot.Commands.Handlers;

/// <summary>Handles "/projects" — lists all projects with their current phase.</summary>
public sealed class ProjectsCommandHandler : ICommandHandler
{
    private readonly IPlatformApiClient _api;
    private readonly IMessageSender _sender;

    public ProjectsCommandHandler(IPlatformApiClient api, IMessageSender sender)
    {
        _api = api;
        _sender = sender;
    }

    public string Command => "/projects";

    public async Task HandleAsync(CommandRequest request, CancellationToken cancellationToken = default)
    {
        var projects = await _api.GetProjectsAsync(cancellationToken);

        string text;
        if (projects.Count == 0)
        {
            text = "No projects yet.";
        }
        else
        {
            var lines = projects.Select(p => $"• {p.Name} [{p.CurrentPhase}] — {p.Id}");
            text = "Projects:\n" + string.Join('\n', lines);
        }

        await _sender.SendMessageAsync(request.ChatId, text, cancellationToken);
    }
}
