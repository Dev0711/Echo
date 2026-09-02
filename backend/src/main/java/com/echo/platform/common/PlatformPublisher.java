package com.echo.platform.common;

public interface PlatformPublisher {
    PublishResult publish(FormattedContent content, PlatformCredentials creds);
    String platformKey();
}

public record PlatformCredentials(
    String apiKey,
    String accessToken,
    String refreshToken,
    String clientId,
    String clientSecret
) {}

public record PublishResult(
    boolean success,
    String platformId,
    String url,
    java.util.List<String> threadIds,
    String error,
    long rateLimitResetAt
) {}