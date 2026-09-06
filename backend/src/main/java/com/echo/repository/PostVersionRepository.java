package com.echo.repository;

import com.echo.model.PostVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostVersionRepository extends MongoRepository<PostVersion, String> {
    
    @Query("{ 'postId' : ?0 }")
    List<PostVersion> findAllByPostIdOrderBySavedAtDesc(String postId);
}