using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Application.Modules.Restaurant.Reservations.Commands;

/// <summary>
/// POST /api/v1/reservations
/// { branchId, customer{name,email,phone}, partySize, dateTime, tableId?, notes? }
/// -> { reference }
/// </summary>
public sealed record CreateReservationCommand(
    Guid BranchId,
    CustomerInfo Customer,
    int PartySize,
    DateTimeOffset DateTime,
    Guid? TableId = null,
    string? Notes = null) : IRequest<CreateReservationResult>;

public sealed record CreateReservationResult(string Reference);

public sealed class CreateReservationCommandHandler
    : IRequestHandler<CreateReservationCommand, CreateReservationResult>
{
    private readonly IReservationRepository _reservations;
    private readonly IBranchRepository _branches;
    private readonly IUnitOfWork _unitOfWork;

    public CreateReservationCommandHandler(
        IReservationRepository reservations,
        IBranchRepository branches,
        IUnitOfWork unitOfWork)
    {
        _reservations = reservations;
        _branches = branches;
        _unitOfWork = unitOfWork;
    }

    public async Task<CreateReservationResult> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
    {
        if (!await _branches.ExistsAsync(request.BranchId, cancellationToken))
        {
            throw new NotFoundException("Branch", request.BranchId);
        }

        var reference = await GenerateUniqueReferenceAsync(cancellationToken);

        var reservation = new Reservation(
            reference,
            request.BranchId,
            request.Customer.Name,
            request.Customer.Email,
            request.Customer.Phone,
            request.PartySize,
            request.DateTime,
            request.TableId,
            request.Notes);

        await _reservations.AddAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateReservationResult(reference);
    }

    private async Task<string> GenerateUniqueReferenceAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var candidate = $"RSV-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
            if (!await _reservations.ReferenceExistsAsync(candidate, cancellationToken))
            {
                return candidate;
            }
        }

        return $"RSV-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }
}

public sealed class CreateReservationCommandValidator : AbstractValidator<CreateReservationCommand>
{
    public CreateReservationCommandValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.PartySize).GreaterThanOrEqualTo(1).WithMessage("Party size must be at least 1.");
        RuleFor(x => x.DateTime)
            .GreaterThan(_ => DateTimeOffset.UtcNow)
            .WithMessage("Reservation date/time must be in the future.");

        RuleFor(x => x.Customer).NotNull();
        RuleFor(x => x.Customer.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Customer.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Customer.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
