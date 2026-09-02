package com.echo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishRequest {

    @NotNull(message = "Platforms to publish must be specified")
    private Set<@NotBlank String> platforms;

    // Optional per-platform credentials override (for testing)
    private Map<String, PlatformCredentialsDto> credentials;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PlatformCredentialsDto {
    private String apiKey;
    private String accessToken;
    private String refreshToken;
    private String clientId;
    private String clientSecret;
}