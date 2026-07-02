namespace SoftwareFactory.FactoryBot.Commands;

/// <summary>
/// Everything a handler needs to act on a command: the parsed command plus the origin chat and a
/// display name for the requester (used as <c>approvedBy</c> when recording an approval).
/// </summary>
public sealed record CommandRequest(ParsedCommand Command, long ChatId, string RequestedBy);
