namespace SoftwareFactory.Application.Common.Caching;

/// <summary>
/// Distributed cache abstraction (implemented by Redis in Infrastructure).
/// Values are JSON-serialized; TTL is per entry.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken cancellationToken = default);

    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}
