package com.echo.dto;

import jakarta.validation.constraints.Size;

public record VersionUpdateRequest(
        @Size(max = 80, message = "Label must not exceed 80 characters") String label,
        Boolean pinned
) {}
