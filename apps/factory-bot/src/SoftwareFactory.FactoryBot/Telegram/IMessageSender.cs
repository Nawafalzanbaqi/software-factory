namespace SoftwareFactory.FactoryBot.Telegram;

/// <summary>
/// Abstraction over sending Telegram messages so command handlers and the notifier are
/// unit-testable without a real bot token or network. Implemented by <c>TelegramMessageSender</c>.
/// </summary>
public interface IMessageSender
{
    Task SendMessageAsync(long chatId, string text, CancellationToken cancellationToken = default);
}
