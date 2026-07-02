namespace SoftwareFactory.FactoryBot.Commands;

/// <summary>
/// Routes a <see cref="CommandRequest"/> to the matching <see cref="ICommandHandler"/>.
/// Unknown or unregistered commands fall through to the "/help" handler.
/// </summary>
public sealed class CommandDispatcher
{
    private readonly IReadOnlyDictionary<string, ICommandHandler> _handlers;
    private readonly ICommandHandler _fallback;

    public CommandDispatcher(IEnumerable<ICommandHandler> handlers)
    {
        _handlers = handlers.ToDictionary(h => h.Command, StringComparer.OrdinalIgnoreCase);

        if (!_handlers.TryGetValue("/help", out var help))
        {
            throw new InvalidOperationException("A '/help' handler must be registered.");
        }

        _fallback = help;
    }

    public Task DispatchAsync(CommandRequest request, CancellationToken cancellationToken = default)
    {
        var handler = _handlers.TryGetValue(request.Command.Name, out var found) ? found : _fallback;
        return handler.HandleAsync(request, cancellationToken);
    }
}
