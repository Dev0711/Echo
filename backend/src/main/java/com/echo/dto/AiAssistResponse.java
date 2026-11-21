package com.echo.dto;

import java.util.List;
import java.util.Map;

/**
 * Exactly one of the fields is populated depending on the action:
 * {@code result} for text rewrites, {@code items} for list suggestions (tags, titles),
 * {@code sections} for keyed outputs (social posts).
 */
public record AiAssistResponse(
        String result,
        List<String> items,
        Map<String, String> sections
) {
    public static AiAssistResponse text(String text) { return new AiAssistResponse(text, null, null); }
    public static AiAssistResponse list(List<String> items) { return new AiAssistResponse(null, items, null); }
    public static AiAssistResponse sections(Map<String, String> s) { return new AiAssistResponse(null, null, s); }
}
