package com.echo.platform.common.dto;

import lombok.Data;

@Data
public class ChunkedContentDto extends FormattedContentDto {
    private java.util.List<String> chunks;
}
