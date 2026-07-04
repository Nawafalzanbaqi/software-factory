# =========================================================================
# Multi-stage build for the SoftwareFactory Platform (control plane) API.
#   build stage : dotnet 9 SDK -> restore + publish
#   final stage : aspnet 9 runtime -> minimal image, non-root, port 5090
# =========================================================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy central build config + project files first for better layer caching.
COPY Directory.Build.props Directory.Packages.props ./
COPY src/SoftwareFactory.Platform.Domain/SoftwareFactory.Platform.Domain.csproj src/SoftwareFactory.Platform.Domain/
COPY src/SoftwareFactory.Platform.Application/SoftwareFactory.Platform.Application.csproj src/SoftwareFactory.Platform.Application/
COPY src/SoftwareFactory.Platform.Infrastructure/SoftwareFactory.Platform.Infrastructure.csproj src/SoftwareFactory.Platform.Infrastructure/
COPY src/SoftwareFactory.Platform.Api/SoftwareFactory.Platform.Api.csproj src/SoftwareFactory.Platform.Api/
RUN dotnet restore src/SoftwareFactory.Platform.Api/SoftwareFactory.Platform.Api.csproj

# Copy the rest of the source and publish.
COPY . .
RUN dotnet publish src/SoftwareFactory.Platform.Api/SoftwareFactory.Platform.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
# curl is used by the docker-compose healthcheck (GET /health).
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
# Program.cs binds localhost-only when ASPNETCORE_URLS is unset — inside a
# container it must listen on all interfaces so other services can reach it.
ENV ASPNETCORE_URLS=http://+:5090
ENV DOTNET_RUNNING_IN_CONTAINER=true
EXPOSE 5090
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "SoftwareFactory.Platform.Api.dll"]
