package com.echo.platform.common;

import java.util.List;

public record SingleBodyContent(String title, String body, List<String> tags) implements FormattedContent {}
