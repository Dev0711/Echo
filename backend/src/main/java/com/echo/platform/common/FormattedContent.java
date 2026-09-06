package com.echo.platform.common;

public sealed interface FormattedContent permits SingleBodyContent, ChunkedContent {}
