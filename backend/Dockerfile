# =========================================================================
# Multi-stage build for the SoftwareFactory .NET 9 API.
#   build stage : dotnet 9 SDK -> restore + publish
#   final stage : aspnet 9 runtime -> minimal image, non-root, port 8080
# =========================================================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution + central build config first for better layer caching.
COPY Directory.Build.props Directory.Packages.props ./
COPY src/SoftwareFactory.Domain/SoftwareFactory.Domain.csproj src/SoftwareFactory.Domain/
COPY src/SoftwareFactory.Application/SoftwareFactory.Application.csproj src/SoftwareFactory.Application/
COPY src/SoftwareFactory.Infrastructure/SoftwareFactory.Infrastructure.csproj src/SoftwareFactory.Infrastructure/
COPY src/SoftwareFactory.Api/SoftwareFactory.Api.csproj src/SoftwareFactory.Api/
RUN dotnet restore src/SoftwareFactory.Api/SoftwareFactory.Api.csproj

# Copy the rest of the source and publish.
COPY . .
RUN dotnet publish src/SoftwareFactory.Api/SoftwareFactory.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
EXPOSE 8080
COPY --from=build /app/publish .
# options.json is mounted at /app/options.json by docker-compose (read at startup).
USER $APP_UID
ENTRYPOINT ["dotnet", "SoftwareFactory.Api.dll"]
