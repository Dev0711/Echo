package com.echo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "users")
public record User(
        @Id String id,
        @Indexed(unique = true) String googleId,
        @Indexed(unique = true) String email,
        String name,
        String picture,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt
) {}
