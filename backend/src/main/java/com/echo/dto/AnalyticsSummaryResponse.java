package com.echo.dto;

import java.util.Map;

public record AnalyticsSummaryResponse(
    int totalPosts,
    int draftPosts,
    int publishedPosts,
    int scheduledPosts,
    int failedPublishes,
    Map<String, Integer> publishedPerPlatform,
    Map<String, Integer> tagFrequency,
    Map<String, Integer> postsPerDay,
    double avgWordCount
) {}
