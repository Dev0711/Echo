package com.echo.platform.linkedin;

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
public class LinkedInPublisher implements PlatformPublisher {

    private final WebClient webClient;

    public LinkedInPublisher() {
        this.webClient = WebClient.builder()
            .baseUrl("https://api.linkedin.com/v2")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public PublishResult publish(com.echo.platform.common.FormattedContent content, PlatformCredentials creds) {
        if (!(content instanceof com.echo.platform.common.SingleBodyContent single)) {
            return new PublishResult(false, null, null, null, "Invalid content type for LinkedIn", 0);
        }

        try {
            // LinkedIn UGC Post API
            String body = """
                {
                    "author": "urn:li:person:%s",
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {
                                "text": "%s"
                            },
                            "shareMediaCategory": "NONE"
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                    }
                }
                """.formatted(
                creds.apiKey(), // This should be the person URN
                escapeJson(single.body())
            );

            String response = webClient.post()
                .uri("/ugcPosts")
                .header("Authorization", "Bearer " + creds.accessToken())
                .header("X-Restli-Protocol-Version", "2.0.0")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(30));

            String platformId = extractJsonField(response, "id");
            String url = "https://www.linkedin.com/feed/update/" + platformId;

            return new PublishResult(true, platformId, url, null, null, 0);
        } catch (Exception e) {
            return new PublishResult(false, null, null, null, e.getMessage(), 0);
        }
    }

    @Override
    public String platformKey() {
        return "linkedin";
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