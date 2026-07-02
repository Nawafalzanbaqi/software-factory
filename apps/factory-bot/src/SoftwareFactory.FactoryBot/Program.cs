using SoftwareFactory.FactoryBot.Commands;
using SoftwareFactory.FactoryBot.Commands.Handlers;
using SoftwareFactory.FactoryBot.Configuration;
using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Services;
using SoftwareFactory.FactoryBot.Telegram;
using Telegram.Bot;

var builder = Host.CreateApplicationBuilder(args);

// --- Configuration (env vars per PHASE3.md §3) ---
builder.Services.AddOptions<BotOptions>().Configure(o =>
{
    var cfg = builder.Configuration;
    o.TelegramBotToken = cfg["TELEGRAM_BOT_TOKEN"] ?? o.TelegramBotToken;

    var chatId = cfg["TELEGRAM_CHAT_ID"];
    if (long.TryParse(chatId, out var parsedChatId))
    {
        o.TelegramChatId = parsedChatId;
    }

    o.PlatformApiBaseUrl = cfg["PLATFORM_API_BASE_URL"] ?? o.PlatformApiBaseUrl;

    var pollSeconds = cfg["DEPLOYMENT_POLL_SECONDS"];
    if (int.TryParse(pollSeconds, out var parsedPoll) && parsedPoll > 0)
    {
        o.DeploymentPollSeconds = parsedPoll;
    }
});

var botToken = builder.Configuration["TELEGRAM_BOT_TOKEN"] ?? string.Empty;
var platformBaseUrl = builder.Configuration["PLATFORM_API_BASE_URL"] ?? "http://localhost:5090";

// --- Telegram client + message sender ---
builder.Services.AddSingleton<ITelegramBotClient>(_ => new TelegramBotClient(botToken));
builder.Services.AddSingleton<IMessageSender, TelegramMessageSender>();

// --- Typed Platform API client (no duplicated business logic) ---
builder.Services.AddHttpClient<IPlatformApiClient, PlatformApiClient>(client =>
{
    client.BaseAddress = new Uri(platformBaseUrl.TrimEnd('/') + "/");
});

// --- Command routing ---
builder.Services.AddSingleton<CommandParser>();
builder.Services.AddScoped<ICommandHandler, ProjectsCommandHandler>();
builder.Services.AddScoped<ICommandHandler, StatusCommandHandler>();
builder.Services.AddScoped<ICommandHandler, ApproveCommandHandler>();
builder.Services.AddScoped<ICommandHandler, HelpCommandHandler>();
builder.Services.AddScoped<CommandDispatcher>();

// --- Time (testable) ---
builder.Services.AddSingleton(TimeProvider.System);

// --- Hosted services ---
builder.Services.AddHostedService<TelegramWorker>();
builder.Services.AddHostedService<DeploymentNotifier>();

var host = builder.Build();
host.Run();
