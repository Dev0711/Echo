package com.echo.repository;

import com.echo.model.PostVersion;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostVersionRepository extends MongoRepository<PostVersion, String> {

    /** Newest first. Declared by name (no @Query) so the sort is actually applied. */
    List<PostVersion> findByPostIdOrderBySavedAtDesc(String postId);

    Optional<PostVersion> findFirstByPostIdOrderBySavedAtDesc(String postId);

    Optional<PostVersion> findByIdAndPostId(String id, String postId);

    void deleteByPostId(String postId);
}
