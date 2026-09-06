package com.echo.dto;

import com.echo.platform.common.FormattedContent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormattedContentResponse {
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
