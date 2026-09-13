package com.echo.platform.medium;

import com.echo.platform.common.PlatformCredentials;
import com.echo.platform.common.PlatformPublisher;
import com.echo.platform.common.PublishResult;
import com.echo.platform.common.SingleBodyContent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Component
public class MediumPublisher implements PlatformPublisher {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public MediumPublisher() {
        this.webClient = WebClient.builder()
            .baseUrl("https://api.medium.com/v1")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public PublishResult publish(com.echo.platform.common.FormattedContent content, PlatformCredentials creds) {
        if (!(content instanceof SingleBodyContent single)) {
            return new PublishResult(false, null, null, null, "Invalid content type for Medium", 0);
        }

        try {
            // 1. Get User ID (Author ID)
            String meResponse = webClient.get()
                .uri("/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + creds.accessToken())
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(10));

            JsonNode meNode = objectMapper.readTree(meResponse);
            String authorId = meNode.path("data").path("id").asText();

            if (authorId == null || authorId.isEmpty()) {
                return new PublishResult(false, null, null, null, "Failed to retrieve Medium author ID", 0);
            }

            // 2. Publish Post
            String requestBody = objectMapper.createObjectNode()
                .put("title", single.title())
                .put("contentFormat", "html") // MediumFormatter outputs HTML
                .put("content", single.body())
                .put("publishStatus", "public")
                .set("tags", objectMapper.valueToTree(single.tags()))
                .toString();

            String publishResponse = webClient.post()
                .uri("/users/" + authorId + "/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + creds.accessToken())
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(30));

            JsonNode publishNode = objectMapper.readTree(publishResponse);
            String url = publishNode.path("data").path("url").asText();
            String id = publishNode.path("data").path("id").asText();

            return new PublishResult(true, id, url, null, null, 0);

        } catch (Exception e) {
            return new PublishResult(false, null, null, null, e.getMessage(), 0);
        }
    }

    @Override
    public String platformKey() {
        return "medium";
    }
}
