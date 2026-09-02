package com.echo.platform.devto;

import com.echo.platform.common.PlatformCredentials;
import com.echo.platform.common.PlatformPublisher;
import com.echo.platform.common.PublishResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class DevToPublisher implements PlatformPublisher {

    private final WebClient webClient;

    public DevToPublisher() {
        this.webClient = WebClient.builder()
            .baseUrl("https://dev.to/api")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public PublishResult publish(com.echo.platform.common.FormattedContent content, PlatformCredentials creds) {
        if (!(content instanceof com.echo.platform.common.SingleBodyContent single)) {
            return new PublishResult(false, null, null, null, "Invalid content type for Dev.to", 0);
        }

        try {
            String body = """
                {
                    "article": {
                        "title": "%s",
                        "body_markdown": "%s",
                        "published": true,
                        "tags": %s
                    }
                }
                """.formatted(
                escapeJson(single.title()),
                escapeJson(single.body()),
                single.tags().toString().replace(' ', "")
            );

            String response = webClient.post()
                .uri("/articles")
                .header("api-key", creds.apiKey())
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(30));

            // Parse response for article ID and URL
            // Dev.to returns: {"article": {"id": 123, "url": "https://dev.to/..."}}
            String platformId = extractJsonField(response, "id");
            String url = extractJsonField(response, "url");

            return new PublishResult(true, platformId, url, null, null, 0);
        } catch (Exception e) {
            return new PublishResult(false, null, null, null, e.getMessage(), 0);
        }
    }

    @Override
    public String platformKey() {
        return "devto";
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    private String extractJsonField(String json, String field) {
        // Simple extraction - in production use Jackson
        String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]*)\"";
        var matcher = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (matcher.find()) return matcher.group(1);
        
        // Try numeric field
        pattern = "\"" + field + "\"\\s*:\\s*(\\d+)";
        matcher = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (matcher.find()) return matcher.group(1);
        
        return null;
    }
}