package com.echo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * An immutable snapshot ("checkpoint") of a post. Unpinned snapshots expire automatically
 * through the TTL index on {@code expireAt}; pinned ones (published, named, restored) never do.
 */
@Document(collection = "post_versions")
@CompoundIndex(name = "post_savedAt_idx", def = "{'postId': 1, 'savedAt': -1}")
public record PostVersion(
        @Id String id,
        String postId,
        String title,
        String bodyMarkdown,
        String structuredContent,
        String contentHash,
        Integer wordCount,
        Reason reason,
        String label,
        Boolean pinned,
        Instant savedAt,
        @Indexed(expireAfterSeconds = 0) Instant expireAt
) {
    // Boxed on purpose: documents written before the checkpoint schema lack these fields, and Spring Data
    // cannot construct a record from a missing primitive. Use these null-safe views instead of the raw accessors.
    // (Deliberately not named getX/isX so Jackson does not serialise them as extra properties.)
    public boolean pinnedFlag() { return Boolean.TRUE.equals(pinned); }

    public int words() { return wordCount == null ? 0 : wordCount; }

    public enum Reason { AUTO, MANUAL, PUBLISH, SCHEDULE, PRE_AI, PRE_RESTORE }
}
