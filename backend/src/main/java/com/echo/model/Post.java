package com.echo.model;

import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A post. Use {@code post.toBuilder()...build()} to derive modified copies instead of
 * calling the canonical constructor by hand.
 *
 * <p>Timestamps are {@link LocalDateTime} in UTC (the JVM default zone is forced to UTC in
 * {@code EchoBackendApplication}).
 */
@Builder(toBuilder = true)
@Document(collection = "posts")
public record Post(
        @Id String id,
        @Indexed String userId,
        String title,
        String bodyMarkdown,
        String structuredContent,
        List<String> tags,
        String coverImageUrl,
        String status,
        String sourceUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastAutosavedAt,
        Map<String, PlatformStatus> platforms,
        LocalDateTime scheduledAt,
        Set<String> scheduledPlatforms,
        Map<String, String> platformOverrides,
        String metaDescription,
        String canonicalUrl,
        String seoImageUrl
) {
}
