using Microsoft.Extensions.Options;
using SoftwareFactory.FactoryBot.Configuration;
using SoftwareFactory.FactoryBot.Models;
using SoftwareFactory.FactoryBot.Platform;
using SoftwareFactory.FactoryBot.Telegram;

namespace SoftwareFactory.FactoryBot.Services;

/// <summary>
/// Polling hosted service that hits GET /api/deployments?since=&lt;lastSeen&gt; on an interval,
/// formats new <see cref="DeploymentEventDto"/>s and posts them to the configured chat.
/// // TODO(phase-4): replace polling with an internal event/push feed.
/// </summary>
public sealed class DeploymentNotifier : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IMessageSender _sender;
    private readonly BotOptions _options;
    private readonly ILogger<DeploymentNotifier> _logger;
    private readonly TimeProvider _time;

    private DateTimeOffset _lastSeen;

    public DeploymentNotifier(
        IServiceProvider services,
        IMessageSender sender,
        IOptions<BotOptions> options,
        ILogger<DeploymentNotifier> logger,
        TimeProvider time)
    {
        _services = services;
        _sender = sender;
        _options = options.Value;
        _logger = logger;
        _time = time;
        _lastSeen = _time.GetUtcNow();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Max(1, _options.DeploymentPollSeconds));
        using var timer = new PeriodicTimer(interval, _time);

        _logger.LogInformation(
            "DeploymentNotifier polling deployments every {Seconds}s.", _options.DeploymentPollSeconds);

        do
        {
            try
            {
                await PollOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DeploymentNotifier poll failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task PollOnceAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var api = scope.ServiceProvider.GetRequiredService<IPlatformApiClient>();

        var events = await api.GetDeploymentsSinceAsync(_lastSeen, ct);
        if (events.Count == 0)
        {
            return;
        }

        foreach (var evt in events.OrderBy(e => e.OccurredAt))
        {
            await _sender.SendMessageAsync(_options.TelegramChatId, FormatEvent(evt), ct);
            if (evt.OccurredAt > _lastSeen)
            {
                _lastSeen = evt.OccurredAt;
            }
        }
    }

    internal static string FormatEvent(DeploymentEventDto evt)
        => $"Deployment {evt.Status} ({evt.Source}) for project {evt.ProjectId} at {evt.OccurredAt:u}";
}
