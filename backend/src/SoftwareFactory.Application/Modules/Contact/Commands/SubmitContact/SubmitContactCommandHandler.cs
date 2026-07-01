using MediatR;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Domain.Modules.Contact;

namespace SoftwareFactory.Application.Modules.Contact.Commands.SubmitContact;

public sealed class SubmitContactCommandHandler : IRequestHandler<SubmitContactCommand, Guid>
{
    private readonly IContactMessageRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitContactCommandHandler(IContactMessageRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(SubmitContactCommand request, CancellationToken cancellationToken)
    {
        var message = new ContactMessage(request.Name, request.Email, request.Message);
        await _repository.AddAsync(message, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return message.Id;
    }
}
