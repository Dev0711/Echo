package com.echo.platform.common;

import java.util.List;

public record ChunkedContent(List<String> chunks) implements FormattedContent {}
