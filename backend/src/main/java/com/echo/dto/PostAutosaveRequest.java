package com.echo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

/**
 * Autosave payload. {@code null} means "leave unchanged"; for the nullable string fields
 * (cover image, SEO fields) an empty string means "clear".
 */
public record PostAutosaveRequest(
        @Size(max = 200, message = "Title must not exceed 200 characters") String title,
        @NotNull(message = "Body markdown is required (may be empty)") String bodyMarkdown,
        String structuredContent,
        @Size(max = 10, message = "Maximum 10 tags allowed") List<@Size(max = 30) String> tags,
        Map<String, String> platformOverrides,
        String coverImageUrl,
        String metaDescription,
        String canonicalUrl,
        String seoImageUrl
) {}
