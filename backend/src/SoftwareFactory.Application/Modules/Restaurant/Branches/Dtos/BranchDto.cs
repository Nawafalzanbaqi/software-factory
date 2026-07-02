using SoftwareFactory.Domain.Modules.Restaurant;

namespace SoftwareFactory.Application.Modules.Restaurant.Branches.Dtos;

/// <summary>Branch DTO — includes lat/lng for the locator map (PHASE2.md §3).</summary>
public sealed record BranchDto(
    Guid Id,
    string Slug,
    string NameEn,
    string NameAr,
    string AddressEn,
    string AddressAr,
    string City,
    double Latitude,
    double Longitude,
    string Phone,
    string OpeningHours);

public static class BranchMapping
{
    public static BranchDto ToDto(this Branch branch) => new(
        branch.Id,
        branch.Slug,
        branch.NameEn,
        branch.NameAr,
        branch.AddressEn,
        branch.AddressAr,
        branch.City,
        branch.Location.Latitude,
        branch.Location.Longitude,
        branch.Phone,
        branch.OpeningHours);
}
