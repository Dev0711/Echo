package com.echo.dto;

import java.time.LocalDateTime;

public record CredentialStatusResponse(
    String platform,
    boolean connected,
    LocalDateTime connectedAt
) {}
