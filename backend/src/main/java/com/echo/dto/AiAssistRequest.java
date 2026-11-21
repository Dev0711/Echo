package com.echo.dto;

public record AiAssistRequest(
        String action,
        /** The text to operate on (selection, intro paragraph, or whole post). Falls back to the stored body. */
        String content,
        /** Optional surrounding document, used as read-only context (e.g. for intro rewrites). */
        String context,
        /** Optional option for the action, e.g. the target tone for CHANGE_TONE. */
        String option
) {}
