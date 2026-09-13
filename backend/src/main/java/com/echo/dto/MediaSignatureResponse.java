package com.echo.dto;

public record MediaSignatureResponse(
    String signature,
    long timestamp,
    String apiKey,
    String cloudName
) {}
