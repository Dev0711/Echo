package com.echo.repository;

import com.echo.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByStatusAndScheduledAtLessThanEqual(String status, LocalDateTime date);
}
