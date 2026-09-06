package com.echo.dto;

import jakarta.validation.constraints.NotBlank;
public record PostAutosaveRequest(
    @NotBlank(message = "Body markdown is required")
    String bodyMarkdown
) {}