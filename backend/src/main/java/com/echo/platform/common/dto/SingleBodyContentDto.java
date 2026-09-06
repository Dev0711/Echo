package com.echo.platform.common.dto;

import lombok.Data;

@Data
public class SingleBodyContentDto extends FormattedContentDto {
    private String title;
    private String body;
    private java.util.List<String> tags;
}
