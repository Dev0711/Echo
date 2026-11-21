package com.echo.service;

import com.echo.exception.AiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/** Thin Gemini REST client: timeouts, key in a header (not the URL), real errors instead of fake results. */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final String apiKey;
    private final String model;
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiClient(@Value("${echo.gemini.api-key:}") String apiKey,
                        @Value("${echo.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(45));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param responseSchema if non-null, the model is forced to return JSON matching this schema
     */
    public String generate(String systemInstruction, String userText, double temperature,
                           int maxOutputTokens, Map<String, Object> responseSchema) {
        if (!isConfigured()) {
            throw new AiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The AI assistant isn't set up yet. Add GEMINI_API_KEY to the server configuration.");
        }
        Map<String, Object> generationConfig = new java.util.HashMap<>();
        generationConfig.put("temperature", temperature);
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        if (responseSchema != null) {
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.put("responseSchema", responseSchema);
        }
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userText)))),
                "generationConfig", generationConfig);

        String response;
        try {
            response = restClient.post()
                    .uri(BASE + model + ":generateContent")
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (HttpStatusCodeException e) {
            log.warn("Gemini returned {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new AiException(HttpStatus.TOO_MANY_REQUESTS, "The AI service is busy right now. Try again in a minute.");
            }
            if (e.getStatusCode().value() == 400 || e.getStatusCode().value() == 403) {
                throw new AiException(HttpStatus.BAD_GATEWAY, "The AI service rejected the request. Check the API key and model name.");
            }
            throw new AiException(HttpStatus.BAD_GATEWAY, "The AI service had a problem. Please try again.");
        } catch (ResourceAccessException e) {
            log.warn("Gemini unreachable: {}", e.getMessage());
            throw new AiException(HttpStatus.GATEWAY_TIMEOUT, "The AI service didn't respond in time. Please try again.");
        }
        return extractText(response);
    }

    String extractText(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String blocked = root.path("promptFeedback").path("blockReason").asText("");
            if (!blocked.isEmpty()) {
                throw new AiException(HttpStatus.UNPROCESSABLE_ENTITY, "The AI declined to process this text.");
            }
            JsonNode candidate = root.path("candidates").path(0);
            String finish = candidate.path("finishReason").asText("");
            if ("SAFETY".equals(finish) || "RECITATION".equals(finish)) {
                throw new AiException(HttpStatus.UNPROCESSABLE_ENTITY, "The AI declined to process this text.");
            }
            String text = candidate.path("content").path("parts").path(0).path("text").asText("");
            if (text.isBlank()) {
                throw new AiException(HttpStatus.BAD_GATEWAY, "The AI returned an empty answer. Please try again.");
            }
            if ("MAX_TOKENS".equals(finish)) {
                throw new AiException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "The text is too long for this action. Select a smaller part and try again.");
            }
            return text;
        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException(HttpStatus.BAD_GATEWAY, "Could not read the AI response.");
        }
    }
}
