package com.echo.dto;

public record UpdateProfileRequest(
    String name,
    String bio,
    String avatarUrl
) {}
