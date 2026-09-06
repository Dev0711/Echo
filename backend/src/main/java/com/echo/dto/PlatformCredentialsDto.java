package com.echo.dto;

public record PlatformCredentialsDto(
    String apiKey,
    String accessToken,
    String refreshToken,
    String clientId,
    String clientSecret
) {}
