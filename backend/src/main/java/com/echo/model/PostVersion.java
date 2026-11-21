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
        int wordCount,
        Reason reason,
        String label,
        boolean pinned,
        Instant savedAt,
        @Indexed(expireAfterSeconds = 0) Instant expireAt
) {
    public enum Reason { AUTO, MANUAL, PUBLISH, SCHEDULE, PRE_AI, PRE_RESTORE }
}
