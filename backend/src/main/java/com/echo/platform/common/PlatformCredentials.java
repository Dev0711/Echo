package com.echo.platform.common;

public record PlatformCredentials(
    String apiKey,
    String accessToken,
    String refreshToken,
    String clientId,
    String clientSecret
) {}
