using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SoftwareFactory.FactoryBot.Models;

namespace SoftwareFactory.FactoryBot.Platform;

/// <summary>
/// HttpClient-backed implementation of <see cref="IPlatformApiClient"/>. Registered via
/// AddHttpClient; the BaseAddress is configured from PLATFORM_API_BASE_URL in Program.cs.
/// </summary>
public sealed class PlatformApiClient : IPlatformApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;

    public PlatformApiClient(HttpClient http) => _http = http;

    public async Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(CancellationToken cancellationToken = default)
    {
        var result = await _http.GetFromJsonAsync<List<ProjectDto>>(
            "api/projects", JsonOptions, cancellationToken);
        return result ?? [];
    }

    public async Task<ProjectDetailDto?> GetProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        using var response = await _http.GetAsync($"api/projects/{projectId}", cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ProjectDetailDto>(JsonOptions, cancellationToken);
    }

    public async Task<ApprovalGateDto> ApproveGateAsync(
        Guid projectId,
        string gateType,
        string approvedBy,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var payload = new ApproveGateRequest(gateType, approvedBy, notes);
        using var response = await _http.PostAsJsonAsync(
            $"api/projects/{projectId}/approvals", payload, JsonOptions, cancellationToken);
        response.EnsureSuccessStatusCode();

        var dto = await response.Content.ReadFromJsonAsync<ApprovalGateDto>(JsonOptions, cancellationToken);
        return dto ?? throw new InvalidOperationException("Platform returned an empty approval response.");
    }

    public async Task<IReadOnlyList<DeploymentEventDto>> GetDeploymentsSinceAsync(
        DateTimeOffset since,
        CancellationToken cancellationToken = default)
    {
        var sinceIso = Uri.EscapeDataString(since.ToString("O"));
        var result = await _http.GetFromJsonAsync<List<DeploymentEventDto>>(
            $"api/deployments?since={sinceIso}", JsonOptions, cancellationToken);
        return result ?? [];
    }

    /// <summary>Request body for POST /api/projects/{id}/approvals.</summary>
    private sealed record ApproveGateRequest(string GateType, string ApprovedBy, string? Notes);
}
