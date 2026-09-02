package com.echo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "media")
public record Media(
    @Id String id,
    String postId,
    String originalUrl,
    String altText,
    LocalDateTime uploadedAt
) {}
