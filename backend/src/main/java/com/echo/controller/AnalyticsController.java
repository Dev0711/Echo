package com.echo.controller;

import com.echo.dto.AnalyticsSummaryResponse;
import com.echo.model.Post;
import com.echo.model.PlatformStatus;
import com.echo.repository.PostRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final PostRepository postRepository;

    public AnalyticsController(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @GetMapping("/summary")
    public AnalyticsSummaryResponse getSummary() {
        List<Post> posts = postRepository.findAll();

        int totalPosts = posts.size();
        int draftPosts = 0;
        int publishedPosts = 0;
        int scheduledPosts = 0;
        int failedPublishes = 0;
        
        Map<String, Integer> publishedPerPlatform = new HashMap<>();
        Map<String, Integer> tagFrequency = new HashMap<>();
        Map<String, Integer> postsPerDay = new HashMap<>();
        
        int totalWords = 0;
        int postsWithBody = 0;
        
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (Post post : posts) {
            String status = post.status() != null ? post.status().toUpperCase() : "DRAFT";
            if ("DRAFT".equals(status)) {
                draftPosts++;
            } else if ("PUBLISHED".equals(status)) {
                publishedPosts++;
            } else if ("SCHEDULED".equals(status)) {
                scheduledPosts++;
            }

            if (post.platforms() != null) {
                for (Map.Entry<String, PlatformStatus> entry : post.platforms().entrySet()) {
                    if (entry.getValue() != null) {
                        PlatformStatus.PlatformPublishStatus platStatus = entry.getValue().status();
                        if (platStatus == PlatformStatus.PlatformPublishStatus.PUBLISHED) {
                            publishedPerPlatform.put(entry.getKey(), publishedPerPlatform.getOrDefault(entry.getKey(), 0) + 1);
                        } else if (platStatus == PlatformStatus.PlatformPublishStatus.FAILED) {
                            failedPublishes++;
                        }
                    }
                }
            }

            if (post.tags() != null) {
                for (String tag : post.tags()) {
                    tagFrequency.put(tag, tagFrequency.getOrDefault(tag, 0) + 1);
                }
            }

            if (post.createdAt() != null) {
                LocalDate createdDate = post.createdAt().toLocalDate();
                if (!createdDate.isBefore(thirtyDaysAgo)) {
                    String dateStr = createdDate.format(formatter);
                    postsPerDay.put(dateStr, postsPerDay.getOrDefault(dateStr, 0) + 1);
                }
            }

            if (post.bodyMarkdown() != null && !post.bodyMarkdown().trim().isEmpty()) {
                String[] words = post.bodyMarkdown().trim().split("\\s+");
                totalWords += words.length;
                postsWithBody++;
            }
        }

        double avgWordCount = postsWithBody > 0 ? (double) totalWords / postsWithBody : 0.0;

        return new AnalyticsSummaryResponse(
            totalPosts, draftPosts, publishedPosts, scheduledPosts, failedPublishes,
            publishedPerPlatform, tagFrequency, postsPerDay, avgWordCount
        );
    }
}
