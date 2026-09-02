package com.echo.platform.common;

import com.vladsch.flexmark.ast.Node;

public interface PlatformFormatter {
    FormattedContent format(ParsedPost post);
    String platformKey();
}

public sealed interface FormattedContent permits SingleBodyContent, ChunkedContent {}

public record SingleBodyContent(String title, String body, java.util.List<String> tags) implements FormattedContent {}

public record ChunkedContent(java.util.List<String> chunks) implements FormattedContent {}

public record ParsedPost(String title, Node ast, java.util.List<String> tags, String coverImageUrl) {}