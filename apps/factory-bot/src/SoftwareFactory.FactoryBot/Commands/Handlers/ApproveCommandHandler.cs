using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;

namespace SoftwareFactory.FactoryBot.Commands.Handlers;

/// <summary>
/// Handles "/approve &lt;gate&gt; &lt;projectId&gt;" — records a human approval for one of the three
/// gates (Architecture | Security | Deploy) by POSTing to the Platform API.
/// </summary>
public sealed class ApproveCommandHandler : ICommandHandler
{
    /// <summary>The 3 human gates from ARCHITECTURE.md.</summary>
    private static readonly IReadOnlyDictionary<string, string> ValidGates =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["architecture"] = "Architecture",
            ["security"] = "Security",
            ["deploy"] = "Deploy",
        };

    private readonly IPlatformApiClient _api;
    private readonly IMessageSender _sender;

    public ApproveCommandHandler(IPlatformApiClient api, IMessageSender sender)
    {
        _api = api;
        _sender = sender;
    }

    public string Command => "/approve";

    public async Task HandleAsync(CommandRequest request, CancellationToken cancellationToken = default)
    {
        var gateArg = request.Command.ArgOrNull(0);
        var idArg = request.Command.ArgOrNull(1);

        if (gateArg is null || !ValidGates.TryGetValue(gateArg, out var gateType))
        {
            await _sender.SendMessageAsync(
                request.ChatId,
                "Usage: /approve <gate> <projectId> (gate: Architecture | Security | Deploy)",
                cancellationToken);
            return;
        }

        if (!Guid.TryParse(idArg, out var projectId))
        {
            await _sender.SendMessageAsync(
                request.ChatId,
                "Usage: /approve <gate> <projectId> — projectId must be a GUID.",
                cancellationToken);
            return;
        }

        var gate = await _api.ApproveGateAsync(
            projectId, gateType, request.RequestedBy, notes: null, cancellationToken);

        await _sender.SendMessageAsync(
            request.ChatId,
            $"Approved {gate.GateType} for project {projectId} (by {gate.ApprovedBy}).",
            cancellationToken);
    }
}
