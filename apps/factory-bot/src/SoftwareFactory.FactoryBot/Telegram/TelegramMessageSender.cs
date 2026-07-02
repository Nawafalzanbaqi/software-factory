using Telegram.Bot;

namespace SoftwareFactory.FactoryBot.Telegram;

/// <summary>
/// Thin wrapper around <see cref="ITelegramBotClient"/>. This is the only place that touches the
/// Telegram send API, keeping handlers testable behind <see cref="IMessageSender"/>.
/// </summary>
public sealed class TelegramMessageSender : IMessageSender
{
    private readonly ITelegramBotClient _bot;

    public TelegramMessageSender(ITelegramBotClient bot) => _bot = bot;

    public async Task SendMessageAsync(long chatId, string text, CancellationToken cancellationToken = default)
    {
        await _bot.SendMessage(chatId, text, cancellationToken: cancellationToken);
    }
}
