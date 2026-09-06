package com.echo.platform.hashnode;

import com.echo.platform.common.PlatformCredentials;
import com.echo.platform.common.PlatformPublisher;
import com.echo.platform.common.PublishResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Component
public class HashnodePublisher implements PlatformPublisher {

    private final WebClient webClient;

    public HashnodePublisher() {
        this.webClient = WebClient.builder()
            .baseUrl("https://gql.hashnode.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public PublishResult publish(com.echo.platform.common.FormattedContent content, PlatformCredentials creds) {
        if (!(content instanceof com.echo.platform.common.SingleBodyContent single)) {
            return new PublishResult(false, null, null, null, "Invalid content type for Hashnode", 0);
        }

        try {
            String mutation = """
                mutation PublishPost($input: PublishPostInput!) {
                    publishPost(input: $input) {
                        post {
                            _id
                            url
                        }
                    }
                }
                """;

            String variables = """
                {
                    "input": {
                        "title": "%s",
                        "contentMarkdown": "%s",
                        "tags": %s,
                        "isRepublished": false
                    }
                }
                """.formatted(
                escapeJson(single.title()),
                escapeJson(single.body()),
                single.tags().toString().replace(" ", "")
            );

            String requestBody = """
                {
                    "query": "%s",
                    "variables": %s
                }
                """.formatted(escapeJson(mutation), variables);

            String response = webClient.post()
                .header("Authorization", creds.accessToken())
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(30));

            String platformId = extractJsonField(response, "_id");
            String url = extractJsonField(response, "url");

            return new PublishResult(true, platformId, url, null, null, 0);
        } catch (Exception e) {
            return new PublishResult(false, null, null, null, e.getMessage(), 0);
        }
    }

    @Override
    public String platformKey() {
        return "hashnode";
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
        String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]*)\"";
        var matcher = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (matcher.find()) return matcher.group(1);
        return null;
    }
}