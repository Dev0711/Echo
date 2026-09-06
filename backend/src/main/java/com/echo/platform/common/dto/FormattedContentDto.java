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