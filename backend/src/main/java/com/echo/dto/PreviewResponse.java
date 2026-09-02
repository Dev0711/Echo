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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class FormattedContentResponse {
    private String type; // "SINGLE_BODY" or "CHUNKED"
    private String title;
    private String body;
    private List<String> tags;
    private List<String> chunks;
    
    public static FormattedContentResponse from(FormattedContent content) {
        if (content instanceof com.echo.platform.common.SingleBodyContent single) {
            return FormattedContentResponse.builder()
                    .type("SINGLE_BODY")
                    .title(single.title())
                    .body(single.body())
                    .tags(single.tags())
                    .build();
        } else if (content instanceof com.echo.platform.common.ChunkedContent chunked) {
            return FormattedContentResponse.builder()
                    .type("CHUNKED")
                    .chunks(chunked.chunks())
                    .build();
        }
        return FormattedContentResponse.builder().type("UNKNOWN").build();
    }
}