package com.echo.model;

import java.time.LocalDateTime;
import java.util.List;

public record PlatformStatus(
        PlatformPublishStatus status,
        String url,
        String platformId,
        LocalDateTime publishedAt,
        String error,
        List<String> threadIds
) {
    public enum PlatformPublishStatus {
        NOT_STARTED, PENDING, PUBLISHED, FAILED, MANUAL_REQUIRED
    }
}
