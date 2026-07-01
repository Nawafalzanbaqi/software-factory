using MediatR;
using Microsoft.Extensions.Logging;
using SoftwareFactory.Application.Common.Caching;

namespace SoftwareFactory.Application.Common.Behaviors;

/// <summary>
/// Cache-aside behavior. For requests implementing <see cref="ICacheableQuery"/>,
/// returns a cached response when present, otherwise invokes the handler and
/// stores the result in Redis with the query-supplied TTL.
/// </summary>
public sealed class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICacheService _cache;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger;

    public CachingBehavior(ICacheService cache, ILogger<CachingBehavior<TRequest, TResponse>> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableQuery cacheable)
        {
            return await next();
        }

        var key = cacheable.CacheKey;

        var cached = await _cache.GetAsync<TResponse>(key, cancellationToken);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", key);
            return cached;
        }

        _logger.LogDebug("Cache miss for {CacheKey}", key);
        var response = await next();

        if (response is not null)
        {
            await _cache.SetAsync(key, response, cacheable.Ttl, cancellationToken);
        }

        return response;
    }
}
