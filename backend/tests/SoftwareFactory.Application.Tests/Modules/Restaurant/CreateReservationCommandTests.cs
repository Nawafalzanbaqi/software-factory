using NSubstitute;
using SoftwareFactory.Application.Common.Exceptions;
using SoftwareFactory.Application.Common.Interfaces;
using SoftwareFactory.Application.Modules.Restaurant;
using SoftwareFactory.Application.Modules.Restaurant.Reservations.Commands;
using SoftwareFactory.Application.Shared.Ordering;
using SoftwareFactory.Domain.Modules.Restaurant;
using Xunit;

namespace SoftwareFactory.Application.Tests.Modules.Restaurant;

public class CreateReservationCommandTests
{
    private readonly IReservationRepository _reservations = Substitute.For<IReservationRepository>();
    private readonly IBranchRepository _branches = Substitute.For<IBranchRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private CreateReservationCommandHandler CreateHandler() =>
        new(_reservations, _branches, _unitOfWork);

    private static CreateReservationCommand ValidCommand(Guid branchId) =>
        new(branchId, new CustomerInfo("Layla", "layla@example.com", "+966500000000"),
            PartySize: 4, DateTime: DateTimeOffset.UtcNow.AddDays(2));

    [Fact]
    public async Task Handle_creates_reservation_and_returns_reference_when_branch_exists()
    {
        var branchId = Guid.NewGuid();
        _branches.ExistsAsync(branchId, Arg.Any<CancellationToken>()).Returns(true);
        _reservations.ReferenceExistsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(false);

        var handler = CreateHandler();
        var result = await handler.Handle(ValidCommand(branchId), CancellationToken.None);

        Assert.False(string.IsNullOrWhiteSpace(result.Reference));
        Assert.StartsWith("RSV-", result.Reference);
        await _reservations.Received(1).AddAsync(
            Arg.Is<Reservation>(r => r.BranchId == branchId && r.PartySize == 4 && r.CustomerName == "Layla"),
            Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_throws_when_branch_missing()
    {
        var branchId = Guid.NewGuid();
        _branches.ExistsAsync(branchId, Arg.Any<CancellationToken>()).Returns(false);

        var handler = CreateHandler();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            handler.Handle(ValidCommand(branchId), CancellationToken.None));
        await _reservations.DidNotReceive().AddAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public void Validator_accepts_valid_future_reservation()
    {
        var result = new CreateReservationCommandValidator().Validate(ValidCommand(Guid.NewGuid()));
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validator_rejects_past_datetime()
    {
        var command = new CreateReservationCommand(
            Guid.NewGuid(), new CustomerInfo("Layla", "layla@example.com", "+966500000000"),
            PartySize: 2, DateTime: DateTimeOffset.UtcNow.AddHours(-1));
        var result = new CreateReservationCommandValidator().Validate(command);
        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(0, false)]   // partySize < 1
    [InlineData(1, true)]    // valid
    public void Validator_enforces_party_size(int partySize, bool expectedValid)
    {
        var command = new CreateReservationCommand(
            Guid.NewGuid(), new CustomerInfo("Layla", "layla@example.com", "+966500000000"),
            PartySize: partySize, DateTime: DateTimeOffset.UtcNow.AddDays(1));
        var result = new CreateReservationCommandValidator().Validate(command);
        Assert.Equal(expectedValid, result.IsValid);
    }

    [Fact]
    public void Validator_rejects_invalid_email()
    {
        var command = new CreateReservationCommand(
            Guid.NewGuid(), new CustomerInfo("Layla", "not-an-email", "+966500000000"),
            PartySize: 2, DateTime: DateTimeOffset.UtcNow.AddDays(1));
        var result = new CreateReservationCommandValidator().Validate(command);
        Assert.False(result.IsValid);
    }
}
