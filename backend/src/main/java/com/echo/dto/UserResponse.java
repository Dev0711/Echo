package com.echo.dto;

public record UserResponse(
    String id,
    String email,
    String name,
    String picture
) {}
