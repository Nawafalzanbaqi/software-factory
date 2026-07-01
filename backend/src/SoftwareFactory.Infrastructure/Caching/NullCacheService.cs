using SoftwareFactory.Application.Common.Caching;

namespace SoftwareFactory.Infrastructure.Caching;

/// <summary>
/// No-op cache used when Redis is not configured (e.g. some test scenarios).
/// Always misses.
/// </summary>
public sealed class NullCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) => Task.FromResult<T?>(default);

    public Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) => Task.CompletedTask;
}
