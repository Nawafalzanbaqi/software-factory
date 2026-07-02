using Microsoft.Extensions.Options;
using SoftwareFactory.FactoryBot.Commands;
using SoftwareFactory.FactoryBot.Configuration;
using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace SoftwareFactory.FactoryBot.Services;

/// <summary>
/// BackgroundService that long-polls Telegram (ReceiverOptions) and dispatches incoming messages
/// through the <see cref="CommandParser"/> + <see cref="CommandDispatcher"/>.
/// </summary>
public sealed class TelegramWorker : BackgroundService
{
    private readonly ITelegramBotClient _bot;
    private readonly CommandParser _parser;
    private readonly IServiceProvider _services;
    private readonly ILogger<TelegramWorker> _logger;
    private readonly BotOptions _options;

    public TelegramWorker(
        ITelegramBotClient bot,
        CommandParser parser,
        IServiceProvider services,
        IOptions<BotOptions> options,
        ILogger<TelegramWorker> logger)
    {
        _bot = bot;
        _parser = parser;
        _services = services;
        _options = options.Value;
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var receiverOptions = new ReceiverOptions
        {
            AllowedUpdates = [UpdateType.Message],
            DropPendingUpdates = true,
        };

        _logger.LogInformation("FactoryBot starting Telegram long-polling receiver.");

        _bot.StartReceiving(
            updateHandler: HandleUpdateAsync,
            errorHandler: HandleErrorAsync,
            receiverOptions: receiverOptions,
            cancellationToken: stoppingToken);

        return Task.CompletedTask;
    }

    private async Task HandleUpdateAsync(ITelegramBotClient bot, Update update, CancellationToken ct)
    {
        if (update.Message is not { Text: { } text } message)
        {
            return;
        }

        var parsed = _parser.Parse(text);
        var requestedBy = ResolveRequester(message);
        var request = new CommandRequest(parsed, message.Chat.Id, requestedBy);

        // Resolve a fresh dispatcher scope per update (handlers use scoped HttpClient).
        using var scope = _services.CreateScope();
        var dispatcher = scope.ServiceProvider.GetRequiredService<CommandDispatcher>();

        try
        {
            await dispatcher.DispatchAsync(request, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling command {Command}", parsed.Name);
        }
    }

    private Task HandleErrorAsync(
        ITelegramBotClient bot, Exception exception, HandleErrorSource source, CancellationToken ct)
    {
        _logger.LogError(exception, "Telegram polling error from {Source}", source);
        return Task.CompletedTask;
    }

    private static string ResolveRequester(Message message)
    {
        var from = message.From;
        if (from is null)
        {
            return $"telegram:{message.Chat.Id}";
        }

        if (!string.IsNullOrWhiteSpace(from.Username))
        {
            return $"@{from.Username}";
        }

        var name = $"{from.FirstName} {from.LastName}".Trim();
        return string.IsNullOrEmpty(name) ? $"telegram:{from.Id}" : name;
    }
}
