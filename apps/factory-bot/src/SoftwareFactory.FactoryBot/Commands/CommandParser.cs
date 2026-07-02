namespace SoftwareFactory.FactoryBot.Commands;

/// <summary>
/// Pure, testable parser turning raw Telegram message text into a <see cref="ParsedCommand"/>.
/// Handles bot-mention suffixes (e.g. "/status@FactoryBot") and normalizes the command name to
/// lowercase. Non-command / empty text yields a command named "/help" so callers fall through to help.
/// </summary>
public sealed class CommandParser
{
    private static readonly char[] Whitespace = [' ', '\t', '\n', '\r'];

    public ParsedCommand Parse(string? text)
    {
        var raw = text?.Trim() ?? string.Empty;

        if (raw.Length == 0 || raw[0] != '/')
        {
            // Not a command — route to help.
            return new ParsedCommand("/help", [], raw);
        }

        var tokens = raw.Split(Whitespace, StringSplitOptions.RemoveEmptyEntries);
        var name = tokens[0];

        // Strip an "@BotName" mention suffix that Telegram appends in group chats.
        var atIndex = name.IndexOf('@');
        if (atIndex >= 0)
        {
            name = name[..atIndex];
        }

        name = name.ToLowerInvariant();
        var args = tokens.Length > 1 ? tokens[1..] : [];

        return new ParsedCommand(name, args, raw);
    }
}
