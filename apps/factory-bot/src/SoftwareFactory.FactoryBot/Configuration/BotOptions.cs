namespace SoftwareFactory.FactoryBot.Configuration;

/// <summary>
/// Strongly-typed configuration for the Factory Telegram bot, bound from environment variables
/// (see PHASE3.md §3): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PLATFORM_API_BASE_URL.
/// </summary>
public sealed class BotOptions
{
    public const string SectionName = "Bot";

    /// <summary>Telegram Bot API token (env: TELEGRAM_BOT_TOKEN).</summary>
    public string TelegramBotToken { get; set; } = string.Empty;

    /// <summary>Chat the DeploymentNotifier posts notifications to (env: TELEGRAM_CHAT_ID).</summary>
    public long TelegramChatId { get; set; }

    /// <summary>Base URL of the Platform REST API (env: PLATFORM_API_BASE_URL).</summary>
    public string PlatformApiBaseUrl { get; set; } = "http://localhost:5090";

    /// <summary>How often the DeploymentNotifier polls the deployments outbox feed.</summary>
    public int DeploymentPollSeconds { get; set; } = 30;
}
