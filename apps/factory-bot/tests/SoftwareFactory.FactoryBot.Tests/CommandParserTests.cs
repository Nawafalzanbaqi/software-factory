using SoftwareFactory.FactoryBot.Commands;
using Xunit;

namespace SoftwareFactory.FactoryBot.Tests;

public class CommandParserTests
{
    private readonly CommandParser _parser = new();

    [Fact]
    public void Parses_approve_security_with_guid()
    {
        var id = Guid.NewGuid();

        var parsed = _parser.Parse($"/approve Security {id}");

        Assert.Equal("/approve", parsed.Name);
        Assert.Equal(2, parsed.Args.Count);
        Assert.Equal("Security", parsed.Args[0]);
        Assert.Equal(id.ToString(), parsed.Args[1]);
        Assert.True(parsed.IsCommand);
    }

    [Fact]
    public void Normalizes_command_name_to_lowercase()
    {
        var parsed = _parser.Parse("/PROJECTS");

        Assert.Equal("/projects", parsed.Name);
    }

    [Fact]
    public void Strips_bot_mention_suffix()
    {
        var parsed = _parser.Parse("/status@FactoryControlBot abc");

        Assert.Equal("/status", parsed.Name);
        Assert.Equal("abc", Assert.Single(parsed.Args));
    }

    [Fact]
    public void Collapses_extra_whitespace_between_tokens()
    {
        var parsed = _parser.Parse("  /approve   Deploy    xyz  ");

        Assert.Equal("/approve", parsed.Name);
        Assert.Equal(["Deploy", "xyz"], parsed.Args);
    }

    [Theory]
    [InlineData("hello there")]
    [InlineData("")]
    [InlineData(null)]
    public void Non_command_text_routes_to_help(string? text)
    {
        var parsed = _parser.Parse(text);

        Assert.Equal("/help", parsed.Name);
    }
}
