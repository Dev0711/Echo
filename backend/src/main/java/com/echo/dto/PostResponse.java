package com.echo.dto;

import com.echo.model.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {

    private String id;
    private String title;
    private String bodyMarkdown;
    private String structuredContent;
    private List<String> tags;
    private String coverImageUrl;
    private String status;
    private String sourceUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastAutosavedAt;
    private Map<String, PlatformStatusResponse> platforms;
    private LocalDateTime scheduledAt;
    private Set<String> scheduledPlatforms;
    private Map<String, String> platformOverrides;
    private String metaDescription;
    private String canonicalUrl;
    private String seoImageUrl;
    
    public static PostResponse from(Post post) {
        return PostResponse.builder()
                .id(post.id())
                .title(post.title())
                .bodyMarkdown(post.bodyMarkdown())
                .structuredContent(post.structuredContent())
                .tags(post.tags())
                .coverImageUrl(post.coverImageUrl())
                .status(post.status())
                .sourceUrl(post.sourceUrl())
                .createdAt(post.createdAt())
                .updatedAt(post.updatedAt())
                .lastAutosavedAt(post.lastAutosavedAt())
                .platforms(PlatformStatusResponse.fromMap(post.platforms()))
                .scheduledAt(post.scheduledAt())
                .scheduledPlatforms(post.scheduledPlatforms())
                .platformOverrides(post.platformOverrides())
                .metaDescription(post.metaDescription())
                .canonicalUrl(post.canonicalUrl())
                .seoImageUrl(post.seoImageUrl())
                .build();
    }
}