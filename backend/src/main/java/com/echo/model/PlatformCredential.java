package com.echo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import java.time.LocalDateTime;

@Document(collection = "platform_credentials")
@CompoundIndex(name = "user_platform_idx", def = "{'userId': 1, 'platform': 1}", unique = true)
public record PlatformCredential(
        @Id String id,
        String userId,
        String platform,
        String encryptedApiKey,
        String encryptedAccessToken,
        String encryptedRefreshToken,
        String encryptedClientId,
        String encryptedClientSecret,
        boolean connected,
        LocalDateTime connectedAt
) {}
