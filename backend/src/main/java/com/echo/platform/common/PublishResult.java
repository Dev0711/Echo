package com.echo.platform.common;

import java.util.List;

public record PublishResult(
    boolean success,
    String platformId,
    String url,
    List<String> threadIds,
    String error,
    long rateLimitResetAt
) {}
