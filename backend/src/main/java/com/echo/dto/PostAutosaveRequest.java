package com.echo.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;
public record PostAutosaveRequest(
    String title,
    @NotBlank(message = "Body markdown is required")
    String bodyMarkdown,
    String structuredContent,
    Map<String, String> platformOverrides,
    String coverImageUrl,
    String metaDescription,
    String canonicalUrl,
    String seoImageUrl
) {}