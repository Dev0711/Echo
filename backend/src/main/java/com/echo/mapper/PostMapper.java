package com.echo.mapper;

import com.echo.dto.PostCreateRequest;
import com.echo.dto.PostResponse;
import com.echo.model.Post;
import com.echo.model.PlatformStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.Map;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "lastAutosavedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "platforms", expression = "java(createDefaultPlatformStatus())")
    Post toEntity(PostCreateRequest request);

    PostResponse toResponse(Post post);



    default Map<String, PlatformStatus> createDefaultPlatformStatus() {
        return Map.of(
                "devto", new PlatformStatus(PlatformStatus.PlatformPublishStatus.NOT_STARTED, null, null, null, null, null),
                "hashnode", new PlatformStatus(PlatformStatus.PlatformPublishStatus.NOT_STARTED, null, null, null, null, null),
                "twitter", new PlatformStatus(PlatformStatus.PlatformPublishStatus.NOT_STARTED, null, null, null, null, null),
                "linkedin", new PlatformStatus(PlatformStatus.PlatformPublishStatus.NOT_STARTED, null, null, null, null, null),
                "medium", new PlatformStatus(PlatformStatus.PlatformPublishStatus.NOT_STARTED, null, null, null, null, null)
        );
    }
}