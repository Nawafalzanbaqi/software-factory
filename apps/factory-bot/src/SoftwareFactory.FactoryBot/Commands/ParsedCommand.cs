namespace SoftwareFactory.FactoryBot.Commands;

/// <summary>
/// The result of parsing raw message text. <see cref="Name"/> is normalized to a lowercase
/// leading-slash token (e.g. "/approve"); <see cref="Args"/> are the remaining whitespace-split tokens.
/// </summary>
public sealed record ParsedCommand(string Name, IReadOnlyList<string> Args, string Raw)
{
    public bool IsCommand => Name.StartsWith('/');

    public string? ArgOrNull(int index) => index >= 0 && index < Args.Count ? Args[index] : null;
}
