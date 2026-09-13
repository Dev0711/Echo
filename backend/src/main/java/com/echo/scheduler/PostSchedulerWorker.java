package com.echo.scheduler;

import com.echo.model.Post;
import com.echo.repository.PostRepository;
import com.echo.service.PostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PostSchedulerWorker {

    private static final Logger log = LoggerFactory.getLogger(PostSchedulerWorker.class);

    private final PostRepository postRepository;
    private final PostService postService;

    public PostSchedulerWorker(PostRepository postRepository, PostService postService) {
        this.postRepository = postRepository;
        this.postService = postService;
    }

    @Scheduled(cron = "0 * * * * *")
    public void publishScheduledPosts() {
        LocalDateTime now = LocalDateTime.now();
        List<Post> scheduledPosts = postRepository.findByStatusAndScheduledAtLessThanEqual("SCHEDULED", now);

        if (!scheduledPosts.isEmpty()) {
            log.info("Found {} scheduled posts to publish", scheduledPosts.size());
            for (Post post : scheduledPosts) {
                try {
                    log.info("Publishing scheduled post: {}", post.id());
                    postService.publishScheduled(post);
                } catch (Exception e) {
                    log.error("Failed to publish scheduled post: {}", post.id(), e);
                }
            }
        }
    }
}
