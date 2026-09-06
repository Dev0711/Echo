package com.echo.dto;

import com.echo.platform.common.FormattedContent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviewResponse {

    private Map<String, FormattedContentResponse> previews;
    
    public static PreviewResponse from(Map<String, FormattedContent> previews) {
        Map<String, FormattedContentResponse> mapped = previews.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> FormattedContentResponse.from(entry.getValue())
                ));
        return PreviewResponse.builder().previews(mapped).build();
    }
}