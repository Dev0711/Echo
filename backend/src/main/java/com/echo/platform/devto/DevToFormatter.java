package com.echo.platform.devto;

import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.PlatformFormatter;
import com.echo.platform.common.ParsedPost;
import com.echo.platform.common.SingleBodyContent;
import com.vladsch.flexmark.html.HtmlRenderer;
import org.springframework.stereotype.Component;

@Component
public class DevToFormatter implements PlatformFormatter {

    private final HtmlRenderer htmlRenderer;

    public DevToFormatter() {
        this.htmlRenderer = HtmlRenderer.builder().build();
    }

    @Override
    public FormattedContent format(ParsedPost post) {
        String htmlBody = htmlRenderer.render(post.ast());
        return new SingleBodyContent(
            post.title(),
            htmlBody,
            post.tags()
        );
    }

    @Override
    public String platformKey() {
        return "devto";
    }
}
