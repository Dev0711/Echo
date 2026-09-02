package com.echo.dto;

import com.echo.model.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {

    private String id;
    private String title;
    private String bodyMarkdown;
    private List<String> tags;
    private String coverImageUrl;
    private Post.PostStatus status;
    private String sourceUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastAutosavedAt;
    private Map<String, PlatformStatusResponse> platforms;
    
    public static PostResponse from(Post post) {
        return PostResponse.builder()
                .id(post.id())
                .title(post.title())
                .bodyMarkdown(post.bodyMarkdown())
                .tags(post.tags())
                .coverImageUrl(post.coverImageUrl())
                .status(post.status())
                .sourceUrl(post.sourceUrl())
                .createdAt(post.createdAt())
                .updatedAt(post.updatedAt())
                .lastAutosavedAt(post.lastAutosavedAt())
                .platforms(PlatformStatusResponse.fromMap(post.platforms()))
                .build();
    }
}