using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftwareFactory.Platform.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectIntakeSpec : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IntakeSpec",
                table: "projects",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionsJson",
                table: "projects",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IntakeSpec",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "OptionsJson",
                table: "projects");
        }
    }
}
