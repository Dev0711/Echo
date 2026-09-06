package com.echo.platform.common;

public interface PlatformPublisher {
    PublishResult publish(FormattedContent content, PlatformCredentials creds);
    String platformKey();
}