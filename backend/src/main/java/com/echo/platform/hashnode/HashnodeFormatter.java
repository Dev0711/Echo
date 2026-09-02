package com.echo.platform.hashnode;

import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.PlatformFormatter;
import com.echo.platform.common.ParsedPost;
import com.echo.platform.common.SingleBodyContent;
import com.vladsch.flexmark.html.HtmlRenderer;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class HashnodeFormatter implements PlatformFormatter {

    private final HtmlRenderer htmlRenderer;
    private static final Map<String, String> TAG_MAP = new HashMap<>();

    static {
        // Static tag name to ID mapping - to be refreshed manually
        TAG_MAP.put("javascript", "tag_javascript_id");
        TAG_MAP.put("typescript", "tag_typescript_id");
        TAG_MAP.put("react", "tag_react_id");
        TAG_MAP.put("nodejs", "tag_nodejs_id");
        TAG_MAP.put("python", "tag_python_id");
        TAG_MAP.put("java", "tag_java_id");
        TAG_MAP.put("spring", "tag_spring_id");
        TAG_MAP.put("mongodb", "tag_mongodb_id");
        TAG_MAP.put("ai", "tag_ai_id");
        TAG_MAP.put("webdev", "tag_webdev_id");
    }

    public HashnodeFormatter() {
        this.htmlRenderer = HtmlRenderer.builder().build();
    }

    @Override
    public FormattedContent format(ParsedPost post) {
        String htmlBody = htmlRenderer.render(post.ast());
        List<String> tagIds = post.tags().stream()
            .map(tag -> TAG_MAP.getOrDefault(tag.toLowerCase(), TAG_MAP.get("webdev")))
            .toList();
        
        return new SingleBodyContent(
            post.title(),
            htmlBody,
            tagIds
        );
    }

    @Override
    public String platformKey() {
        return "hashnode";
    }
}