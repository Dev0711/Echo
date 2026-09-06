package com.echo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;
public record PublishRequest(
    @NotNull(message = "Platforms to publish must be specified")
    Set<@NotBlank String> platforms,

    // Optional per-platform credentials override (for testing)
    Map<String, PlatformCredentialsDto> credentials
) {}