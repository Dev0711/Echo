package com.echo.mapper;

import com.echo.dto.PostCreateRequest;
import com.echo.dto.PostResponse;
import com.echo.model.Post;
import com.echo.model.PlatformStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.time.LocalDateTime;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface PostMapper {

    PostMapper INSTANCE = Mappers.getMapper(PostMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", constant = "draft")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "lastAutosavedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "platforms", ignore = true)
    Post toEntity(PostCreateRequest request);

    PostResponse toResponse(Post post);

    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "lastAutosavedAt", expression = "java(java.time.LocalDateTime.now())")
    void updateFromRequest(PostCreateRequest request, @MappingTarget Post post);

    default Map<String, PlatformStatus> createDefaultPlatformStatus() {
        return Map.of(
                "devto", new PlatformStatus("not_started", null, null, null, null, null),
                "hashnode", new PlatformStatus("not_started", null, null, null, null, null),
                "twitter", new PlatformStatus("not_started", null, null, null, null, null),
                "linkedin", new PlatformStatus("not_started", null, null, null, null, null),
                "medium", new PlatformStatus("not_started", null, null, null, null, null)
        );
    }
}