package com.echo.platform.common;

public interface PlatformFormatter {
    FormattedContent format(ParsedPost post);
    String platformKey();
}