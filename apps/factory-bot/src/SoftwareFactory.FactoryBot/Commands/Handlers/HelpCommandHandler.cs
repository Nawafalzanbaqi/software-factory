using SoftwareFactory.FactoryBot.Telegram;

namespace SoftwareFactory.FactoryBot.Commands.Handlers;

/// <summary>Handles "/help" and is the fallback for unknown commands.</summary>
public sealed class HelpCommandHandler : ICommandHandler
{
    public const string HelpText =
        "Factory Control Bot — commands:\n" +
        "/projects — list projects with current phase\n" +
        "/status <projectId> — a project's phase, gates and latest deployment\n" +
        "/approve <gate> <projectId> — approve a gate (Architecture | Security | Deploy)\n" +
        "/help — show this message";

    private readonly IMessageSender _sender;

    public HelpCommandHandler(IMessageSender sender) => _sender = sender;

    public string Command => "/help";

    public Task HandleAsync(CommandRequest request, CancellationToken cancellationToken = default)
        => _sender.SendMessageAsync(request.ChatId, HelpText, cancellationToken);
}
