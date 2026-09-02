package com.echo.platform.linkedin;

import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.PlatformFormatter;
import com.echo.platform.common.ParsedPost;
import com.echo.platform.common.SingleBodyContent;
import com.vladsch.flexmark.ast.Node;
import com.vladsch.flexmark.html.HtmlRenderer;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class LinkedInFormatter implements PlatformFormatter {

    private final HtmlRenderer htmlRenderer;

    public LinkedInFormatter() {
        this.htmlRenderer = HtmlRenderer.builder().build();
    }

    @Override
    public FormattedContent format(ParsedPost post) {
        String htmlBody = htmlRenderer.render(post.ast());
        String plainText = htmlToPlainText(htmlBody);
        String withUnicodeBold = markdownBoldToUnicode(plainText);
        
        return new SingleBodyContent(
            post.title(),
            withUnicodeBold,
            post.tags()
        );
    }

    @Override
    public String platformKey() {
        return "linkedin";
    }

    private String htmlToPlainText(String html) {
        // Strip HTML tags
        String text = html.replaceAll("<[^>]*>", "");
        // Decode common HTML entities
        text = text.replace("&", "&")
                  .replace("<", "<")
                  .replace(">", ">")
                  .replace(""", "\"")
                  .replace("'", "'")
                  .replace("&nbsp;", " ");
        // Normalize whitespace
        text = text.replaceAll("\\s+", " ").trim();
        return text;
    }

    private String markdownBoldToUnicode(String text) {
        // Convert **text** to Unicode bold
        Pattern pattern = Pattern.compile("\\*\\*(.+?)\\*\\*");
        Matcher matcher = pattern.matcher(text);
        StringBuffer sb = new StringBuffer();
        
        while (matcher.find()) {
            String boldText = matcher.group(1);
            String unicodeBold = toUnicodeBold(boldText);
            matcher.appendReplacement(sb, unicodeBold);
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String toUnicodeBold(String text) {
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            sb.append(toUnicodeBoldChar(c));
        }
        return sb.toString();
    }

    private char toUnicodeBoldChar(char c) {
        // Mathematical Bold Unicode range: U+1D400–U+1D7FF
        if (c >= 'A' && c <= 'Z') {
            return (char) (0x1D400 + (c - 'A'));
        } else if (c >= 'a' && c <= 'z') {
            return (char) (0x1D41A + (c - 'a'));
        } else if (c >= '0' && c <= '9') {
            return (char) (0x1D7CE + (c - '0'));
        }
        return c;
    }
}