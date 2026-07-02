using SoftwareFactory.FactoryBot.Models;
using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;

namespace SoftwareFactory.FactoryBot.Commands.Handlers;

/// <summary>Handles "/status &lt;projectId&gt;" — one project's phase, gates and latest deployment.</summary>
public sealed class StatusCommandHandler : ICommandHandler
{
    private readonly IPlatformApiClient _api;
    private readonly IMessageSender _sender;

    public StatusCommandHandler(IPlatformApiClient api, IMessageSender sender)
    {
        _api = api;
        _sender = sender;
    }

    public string Command => "/status";

    public async Task HandleAsync(CommandRequest request, CancellationToken cancellationToken = default)
    {
        var idArg = request.Command.ArgOrNull(0);
        if (!Guid.TryParse(idArg, out var projectId))
        {
            await _sender.SendMessageAsync(
                request.ChatId, "Usage: /status <projectId>", cancellationToken);
            return;
        }

        var detail = await _api.GetProjectAsync(projectId, cancellationToken);
        if (detail is null)
        {
            await _sender.SendMessageAsync(
                request.ChatId, $"Project {projectId} not found.", cancellationToken);
            return;
        }

        await _sender.SendMessageAsync(request.ChatId, Format(detail), cancellationToken);
    }

    internal static string Format(ProjectDetailDto detail)
    {
        var p = detail.Project;
        var lines = new List<string>
        {
            $"{p.Name} [{p.CurrentPhase}]",
            $"Id: {p.Id}",
            $"Site type: {p.SiteType}",
            "Gates:",
        };

        if (detail.Gates.Count == 0)
        {
            lines.Add("  (none)");
        }
        else
        {
            foreach (var g in detail.Gates)
            {
                var mark = g.IsApproved
                    ? $"approved by {g.ApprovedBy} at {g.ApprovedAt:u}"
                    : "pending";
                lines.Add($"  • {g.GateType}: {mark}");
            }
        }

        var latest = detail.RecentDeployments
            .OrderByDescending(d => d.OccurredAt)
            .FirstOrDefault();
        lines.Add(latest is null
            ? "Latest deployment: (none)"
            : $"Latest deployment: {latest.Status} ({latest.Source}) at {latest.OccurredAt:u}");

        return string.Join('\n', lines);
    }
}
