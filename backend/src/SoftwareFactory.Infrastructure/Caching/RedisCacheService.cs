using System.Text.Json;
using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Caching;
using StackExchange.Redis;

namespace SoftwareFactory.Infrastructure.Caching;

/// <summary>
/// Redis-backed <see cref="ICacheService"/>. Values are JSON-serialized with
/// a per-entry TTL (default 5 minutes).
/// </summary>
public sealed class RedisCacheService : ICacheService
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var value = await db.StringGetAsync(key);
            if (value.IsNullOrEmpty)
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>(value!, JsonOptions);
        }
        catch (Exception ex)
        {
            // Cache must never break the request path — degrade gracefully.
            _logger.LogWarning(ex, "Redis GET failed for {Key}; treating as miss.", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var payload = JsonSerializer.Serialize(value, JsonOptions);
            await db.StringSetAsync(key, payload, ttl ?? DefaultTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for {Key}.", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis DEL failed for {Key}.", key);
        }
    }
}
