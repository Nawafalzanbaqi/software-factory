using FluentValidation;
using MediatR;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Modules.Restaurant.Reservations.Dtos;

namespace SoftwareFactory.Application.Modules.Restaurant.Reservations.Queries;

/// <summary>GET /api/v1/reservations/{reference} -> ReservationDto (track).</summary>
public sealed record GetReservationByReferenceQuery(string Reference) : IRequest<ReservationDto>;

public sealed class GetReservationByReferenceQueryHandler
    : IRequestHandler<GetReservationByReferenceQuery, ReservationDto>
{
    private readonly IReservationRepository _reservations;

    public GetReservationByReferenceQueryHandler(IReservationRepository reservations) => _reservations = reservations;

    public async Task<ReservationDto> Handle(GetReservationByReferenceQuery request, CancellationToken cancellationToken)
    {
        var reservation = await _reservations.GetByReferenceAsync(request.Reference, cancellationToken)
                          ?? throw new NotFoundException("Reservation", request.Reference);

        return reservation.ToDto();
    }
}

public sealed class GetReservationByReferenceQueryValidator : AbstractValidator<GetReservationByReferenceQuery>
{
    public GetReservationByReferenceQueryValidator()
    {
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(50);
    }
}
