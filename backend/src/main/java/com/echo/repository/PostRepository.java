package com.echo.repository;

import com.echo.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<Post> findByIdAndUserId(String id, String userId);

    List<Post> findByStatusAndScheduledAtLessThanEqual(String status, LocalDateTime date);
}
