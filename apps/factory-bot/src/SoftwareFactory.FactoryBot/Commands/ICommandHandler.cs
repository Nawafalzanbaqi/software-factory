namespace SoftwareFactory.FactoryBot.Commands;

/// <summary>
/// A handler for a single slash command. Handlers depend on <c>IPlatformApiClient</c> and
/// <c>IMessageSender</c> so they can be unit-tested with no network and no real bot token.
/// </summary>
public interface ICommandHandler
{
    /// <summary>The normalized command this handler serves, e.g. "/approve".</summary>
    string Command { get; }

    Task HandleAsync(CommandRequest request, CancellationToken cancellationToken = default);
}
