package com.echo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "post_versions")
public record PostVersion(
    @Id String id,
    String postId,
    String bodyMarkdown,
    LocalDateTime savedAt
) {}
