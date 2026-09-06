package com.echo.platform.twitter;

import com.echo.platform.common.ChunkedContent;
import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.PlatformFormatter;
import com.echo.platform.common.ParsedPost;
import com.vladsch.flexmark.ast.Heading;
import com.vladsch.flexmark.ast.Paragraph;
import com.vladsch.flexmark.ast.Text;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.ast.NodeVisitor;
import com.vladsch.flexmark.util.ast.VisitHandler;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TwitterFormatter implements PlatformFormatter {

    private static final int MAX_TWEET_LENGTH = 280;
    private static final String CONTINUATION_SUFFIX = " (%d/%d)";

    @Override
    public FormattedContent format(ParsedPost post) {
        List<String> chunks = new ArrayList<>();

        // Extract text content from AST
        List<String> paragraphs = extractParagraphs(post.ast());

        // First pass: greedy packing of sentences
        List<String> rawChunks = packIntoChunks(paragraphs);

        // Second pass: add continuation suffixes
        int total = rawChunks.size();
        for (int i = 0; i < total; i++) {
            String suffix = CONTINUATION_SUFFIX.formatted(i + 1, total);
            String chunk = rawChunks.get(i);

            // Ensure chunk + suffix fits
            if (chunk.length() + suffix.length() > MAX_TWEET_LENGTH) {
                chunk = truncateToFit(chunk, MAX_TWEET_LENGTH - suffix.length());
            }
            chunks.add(chunk + suffix);
        }

        return new ChunkedContent(chunks);
    }

    @Override
    public String platformKey() {
        return "twitter";
    }

    private List<String> extractParagraphs(Node rootNode) {
        List<String> paragraphs = new ArrayList<>();

        NodeVisitor visitor = new NodeVisitor(
            new VisitHandler<>(Paragraph.class, node -> {
                String text = extractText(node);
                if (!text.trim().isEmpty()) {
                    paragraphs.add(text.trim());
                }
            }),
            new VisitHandler<>(Heading.class, node -> {
                String text = extractText(node);
                if (!text.trim().isEmpty()) {
                    paragraphs.add(text.trim());
                }
            })
        );
        visitor.visit(rootNode);
        return paragraphs;
    }

    private String extractText(Node node) {
        StringBuilder sb = new StringBuilder();
        NodeVisitor visitor = new NodeVisitor(
            new VisitHandler<>(Text.class, textNode -> sb.append(textNode.getChars().toString()))
        );
        visitor.visit(node);
        return sb.toString();
    }

    private List<String> packIntoChunks(List<String> paragraphs) {
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();

        for (String paragraph : paragraphs) {
            // Split paragraph into sentences
            List<String> sentences = splitIntoSentences(paragraph);

            for (String sentence : sentences) {
                // Reserve space for suffix (we'll compute exact length in second pass)
                int reservedSuffixLength = 10; // " (99/99)" max

                if (currentChunk.length() + sentence.length() + 1 <= MAX_TWEET_LENGTH - reservedSuffixLength) {
                    if (currentChunk.length() > 0) {
                        currentChunk.append(" ");
                    }
                    currentChunk.append(sentence);
                } else {
                    // Current chunk is full, save it
                    if (currentChunk.length() > 0) {
                        chunks.add(currentChunk.toString());
                        currentChunk = new StringBuilder();
                    }

                    // If single sentence exceeds limit, truncate it
                    if (sentence.length() > MAX_TWEET_LENGTH - reservedSuffixLength) {
                        sentence = truncateToFit(sentence, MAX_TWEET_LENGTH - reservedSuffixLength);
                    }
                    currentChunk.append(sentence);
                }
            }
        }

        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString());
        }

        return chunks;
    }

    private List<String> splitIntoSentences(String text) {
        List<String> sentences = new ArrayList<>();
        // Simple sentence splitter - handles . ! ? followed by space or end
        Pattern pattern = Pattern.compile("([^.!?]+[.!?]+)(?=\\s|$)");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            sentences.add(matcher.group(1).trim());
        }

        // If no sentences found, treat whole text as one
        if (sentences.isEmpty() && !text.trim().isEmpty()) {
            sentences.add(text.trim());
        }

        return sentences;
    }

    private String truncateToFit(String text, int maxLength) {
        if (text.length() <= maxLength) return text;
        // Truncate at last space before limit
        int lastSpace = text.lastIndexOf(' ', maxLength);
        if (lastSpace > maxLength * 0.5) {
            return text.substring(0, lastSpace) + "...";
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}