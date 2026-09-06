package com.echo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "posts")
public record Post(
        @Id String id,
        String title,
        String bodyMarkdown,
        List<String> tags,
        String coverImageUrl,
        PostStatus status,
        String sourceUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastAutosavedAt,
        Map<String, PlatformStatus> platforms
) {
    public enum PostStatus {
        DRAFT, READY, PUBLISHED
    }
}
