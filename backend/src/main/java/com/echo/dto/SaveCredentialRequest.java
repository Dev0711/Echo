package com.echo.dto;

public record SaveCredentialRequest(
    String apiKey,
    String accessToken,
    String refreshToken,
    String clientId,
    String clientSecret
) {}
