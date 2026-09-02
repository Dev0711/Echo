package com.echo.dto;

import com.echo.model.PlatformStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatusResponse {

    private PlatformStatus.PlatformPublishStatus status;
    private String url;
    private String platformId;
    private LocalDateTime publishedAt;
    private String error;
    private List<String> threadIds;
    
    public static PlatformStatusResponse from(PlatformStatus status) {
        return PlatformStatusResponse.builder()
                .status(status.status())
                .url(status.url())
                .platformId(status.platformId())
                .publishedAt(status.publishedAt())
                .error(status.error())
                .threadIds(status.threadIds())
                .build();
    }
    
    public static Map<String, PlatformStatusResponse> fromMap(Map<String, PlatformStatus> platforms) {
        if (platforms == null) {
            return Map.of();
        }
        return platforms.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> from(entry.getValue())
                ));
    }
}