using SoftwareFactory.Platform.Application.Abstractions;
using SoftwareFactory.Platform.Application.Common;
using SoftwareFactory.Platform.Application.Dtos;
using SoftwareFactory.Platform.Domain.Entities;

namespace SoftwareFactory.Platform.Application.Services;

public sealed class ClientService : IClientService
{
    private readonly IClientRepository _clients;
    private readonly IProjectRepository _projects;
    private readonly IUnitOfWork _uow;

    public ClientService(IClientRepository clients, IProjectRepository projects, IUnitOfWork uow)
    {
        _clients = clients;
        _projects = projects;
        _uow = uow;
    }

    public async Task<ClientDto> CreateClientAsync(CreateClientRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ValidationException("Client name is required.");

        var client = new Client
        {
            Name = request.Name.Trim(),
            ContactEmail = string.IsNullOrWhiteSpace(request.ContactEmail) ? null : request.ContactEmail.Trim(),
            Notes = request.Notes
        };

        await _clients.AddAsync(client, ct);
        await _uow.SaveChangesAsync(ct);
        return client.ToDto();
    }

    public async Task<IReadOnlyList<ClientDto>> GetClientsAsync(CancellationToken ct = default)
    {
        var clients = await _clients.ListAsync(ct);
        return clients.Select(c => c.ToDto()).ToList();
    }

    public async Task<ClientDto?> GetClientAsync(Guid id, CancellationToken ct = default)
    {
        var client = await _clients.GetByIdAsync(id, ct);
        return client?.ToDto();
    }

    public async Task<IReadOnlyList<ProjectDto>> GetClientProjectsAsync(Guid clientId, CancellationToken ct = default)
    {
        var projects = await _projects.ListByClientAsync(clientId, ct);
        return projects.Select(p => p.ToDto()).ToList();
    }
}
