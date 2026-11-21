package com.echo.dto;

import com.echo.model.PostVersion;

import java.time.Instant;

/** Lightweight version listing entry (no full body). */
public record VersionSummary(
        String id,
        String title,
        PostVersion.Reason reason,
        String label,
        boolean pinned,
        int wordCount,
        Instant savedAt,
        String preview
) {
    public static VersionSummary from(PostVersion v) {
        String body = v.bodyMarkdown() == null ? "" : v.bodyMarkdown().strip();
        String preview = body.length() > 160 ? body.substring(0, 160) + "…" : body;
        return new VersionSummary(v.id(), v.title(), v.reason(), v.label(), v.pinned(),
                v.wordCount(), v.savedAt(), preview);
    }
}
