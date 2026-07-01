namespace SoftwareFactory.Application.Common.Caching;

/// <summary>
/// Marker for queries whose results should be cached by
/// <c>CachingBehavior</c>. The query supplies its own cache key + TTL.
/// </summary>
public interface ICacheableQuery
{
    string CacheKey { get; }

    TimeSpan? Ttl { get; }
}
