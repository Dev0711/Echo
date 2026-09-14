package com.echo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${echo.gemini.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String assist(String action, String content) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "AI assistant not configured. Please add GEMINI_API_KEY to your .env.properties";
        }

        String prompt = buildPrompt(action, content);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> part = new HashMap<>();
        part.put("parts", Collections.singletonList(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(part));

        try {
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            String responseStr = restTemplate.postForObject(url, requestEntity, String.class);
            
            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText();
                }
            }
            return "Could not extract response from AI.";
        } catch (Exception e) {
            return "Error calling AI assistant: " + e.getMessage();
        }
    }

    private String buildPrompt(String action, String content) {
        return switch (action) {
            case "improve_intro" -> "Improve the introduction of this blog post. Return only the improved introduction paragraph:\n\n" + (content.length() > 500 ? content.substring(0, 500) : content);
            case "suggest_tags" -> "Suggest 5 SEO-friendly tags for this blog post. Return only a comma-separated list:\n\n" + content;
            case "summarize" -> "Write a 2-sentence TL;DR summary for this blog post:\n\n" + content;
            case "fix_grammar" -> "Fix grammar and spelling in this text. Return only the corrected text:\n\n" + content;
            default -> content;
        };
    }
}
