package com.echo.platform.common;

import com.vladsch.flexmark.util.ast.Node;
import java.util.List;

public record ParsedPost(String title, Node ast, List<String> tags, String coverImageUrl) {}
