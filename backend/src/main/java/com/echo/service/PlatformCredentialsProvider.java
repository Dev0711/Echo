package com.echo.service;

import com.echo.dto.PlatformCredentialsDto;
import com.echo.platform.common.PlatformCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class PlatformCredentialsProvider {

    private final Map<String, PlatformCredentials> defaultCredentials = new HashMap<>();

    public PlatformCredentialsProvider(
            @Value("${echo.platforms.devto.api-key:}") String devtoApiKey,
            @Value("${echo.platforms.hashnode.access-token:}") String hashnodeAccessToken,
            @Value("${echo.platforms.twitter.api-key:}") String twitterApiKey,
            @Value("${echo.platforms.twitter.api-secret:}") String twitterApiSecret,
            @Value("${echo.platforms.twitter.access-token:}") String twitterAccessToken,
            @Value("${echo.platforms.twitter.access-token-secret:}") String twitterAccessTokenSecret,
            @Value("${echo.platforms.linkedin.client-id:}") String linkedinClientId,
            @Value("${echo.platforms.linkedin.client-secret:}") String linkedinClientSecret,
            @Value("${echo.platforms.linkedin.access-token:}") String linkedinAccessToken) {
        
        defaultCredentials.put("devto", new PlatformCredentials(devtoApiKey, null, null, null, null));
        defaultCredentials.put("hashnode", new PlatformCredentials(null, hashnodeAccessToken, null, null, null));
        defaultCredentials.put("twitter", new PlatformCredentials(twitterApiKey, twitterAccessToken, null, null, twitterApiSecret));
        defaultCredentials.put("linkedin", new PlatformCredentials(null, linkedinAccessToken, null, linkedinClientId, linkedinClientSecret));
        defaultCredentials.put("medium", new PlatformCredentials(null, null, null, null, null));
    }

    public PlatformCredentials getCredentials(String platformKey, Map<String, PlatformCredentialsDto> overrides) {
        if (overrides != null && overrides.containsKey(platformKey)) {
            PlatformCredentialsDto override = overrides.get(platformKey);
            return new PlatformCredentials(
                    override.apiKey(),
                    override.accessToken(),
                    override.refreshToken(),
                    override.clientId(),
                    override.clientSecret()
            );
        }
        return defaultCredentials.getOrDefault(platformKey, new PlatformCredentials(null, null, null, null, null));
    }
}
