package com.echo.platform.common.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;

@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = SingleBodyContentDto.class, name = "SINGLE_BODY"),
    @JsonSubTypes.Type(value = ChunkedContentDto.class, name = "CHUNKED")
})
public abstract class FormattedContentDto {
    private String type;
}

@Data
public class SingleBodyContentDto extends FormattedContentDto {
    private String title;
    private String body;
    private java.util.List<String> tags;
}

@Data
public class ChunkedContentDto extends FormattedContentDto {
    private java.util.List<String> chunks;
}