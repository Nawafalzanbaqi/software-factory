using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftwareFactory.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase2Restaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShippingAddress",
                table: "orders");

            migrationBuilder.RenameColumn(
                name: "ProductNameEn",
                table: "order_items",
                newName: "NameEn");

            migrationBuilder.RenameColumn(
                name: "ProductNameAr",
                table: "order_items",
                newName: "NameAr");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "order_items",
                newName: "ItemId");

            migrationBuilder.RenameColumn(
                name: "ProductSlug",
                table: "cart_items",
                newName: "Slug");

            migrationBuilder.RenameColumn(
                name: "ProductNameEn",
                table: "cart_items",
                newName: "NameEn");

            migrationBuilder.RenameColumn(
                name: "ProductNameAr",
                table: "cart_items",
                newName: "NameAr");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "cart_items",
                newName: "ItemId");

            migrationBuilder.AddColumn<Guid>(
                name: "fulfillment_branch_id",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "fulfillment_delivery_address",
                table: "orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "fulfillment_scheduled_for",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "fulfillment_table_id",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "fulfillment_type",
                table: "orders",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "shipping_address_city",
                table: "orders",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "shipping_address_country",
                table: "orders",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "shipping_address_line",
                table: "orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "order_items",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "order_items",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "branches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    NameAr = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    AddressEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AddressAr = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    City = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    OpeningHours = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: false),
                    longitude = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "menu_categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    NameAr = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "reservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Reference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    TableId = table.Column<Guid>(type: "uuid", nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomerEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    CustomerPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PartySize = table.Column<int>(type: "integer", nullable: false),
                    DateTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reservations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Seats = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tables_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "menu_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    NameAr = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    DescriptionAr = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    SpicyLevel = table.Column<int>(type: "integer", nullable: true),
                    Calories = table.Column<int>(type: "integer", nullable: true),
                    images = table.Column<string>(type: "jsonb", nullable: false),
                    tags = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_menu_items_menu_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "menu_categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_branches_Slug",
                table: "branches",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_menu_categories_Slug",
                table: "menu_categories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_menu_items_CategoryId",
                table: "menu_items",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_menu_items_Slug",
                table: "menu_items",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reservations_BranchId",
                table: "reservations",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_reservations_Reference",
                table: "reservations",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tables_BranchId",
                table: "tables",
                column: "BranchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "menu_items");

            migrationBuilder.DropTable(
                name: "reservations");

            migrationBuilder.DropTable(
                name: "tables");

            migrationBuilder.DropTable(
                name: "menu_categories");

            migrationBuilder.DropTable(
                name: "branches");

            migrationBuilder.DropColumn(
                name: "fulfillment_branch_id",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "fulfillment_delivery_address",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "fulfillment_scheduled_for",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "fulfillment_table_id",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "fulfillment_type",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "shipping_address_city",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "shipping_address_country",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "shipping_address_line",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "order_items");

            migrationBuilder.RenameColumn(
                name: "NameEn",
                table: "order_items",
                newName: "ProductNameEn");

            migrationBuilder.RenameColumn(
                name: "NameAr",
                table: "order_items",
                newName: "ProductNameAr");

            migrationBuilder.RenameColumn(
                name: "ItemId",
                table: "order_items",
                newName: "ProductId");

            migrationBuilder.RenameColumn(
                name: "Slug",
                table: "cart_items",
                newName: "ProductSlug");

            migrationBuilder.RenameColumn(
                name: "NameEn",
                table: "cart_items",
                newName: "ProductNameEn");

            migrationBuilder.RenameColumn(
                name: "NameAr",
                table: "cart_items",
                newName: "ProductNameAr");

            migrationBuilder.RenameColumn(
                name: "ItemId",
                table: "cart_items",
                newName: "ProductId");

            migrationBuilder.AddColumn<string>(
                name: "ShippingAddress",
                table: "orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
