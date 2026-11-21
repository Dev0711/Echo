package com.echo.service;

import com.echo.model.PlatformStatus;
import com.echo.model.PlatformStatus.PlatformPublishStatus;
import com.echo.model.Post;
import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.ParsedPost;
import com.echo.platform.common.PlatformCredentials;
import com.echo.platform.common.PlatformFormatter;
import com.echo.platform.common.PlatformPublisher;
import com.echo.platform.common.PublishResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Publishes one post to one platform in the background.
 *
 * <p>This is a separate bean from {@link PostService} on purpose: {@code @Async} only works when the
 * call goes through the Spring proxy, which a call from inside the same class does not. Platform
 * status is written with targeted {@code $set} updates so concurrent publishes (and autosave) cannot
 * overwrite each other.
 */
@Service
public class PlatformPublishService {

    private static final Logger log = LoggerFactory.getLogger(PlatformPublishService.class);
    static final int MAX_ATTEMPTS = 3;

    private final List<PlatformFormatter> formatters;
    private final List<PlatformPublisher> publishers;
    private final MongoTemplate mongoTemplate;

    public PlatformPublishService(List<PlatformFormatter> formatters,
                                  List<PlatformPublisher> publishers,
                                  MongoTemplate mongoTemplate) {
        this.formatters = formatters;
        this.publishers = publishers;
        this.mongoTemplate = mongoTemplate;
    }

    public boolean isSupported(String platformKey) {
        return formatters.stream().anyMatch(f -> f.platformKey().equals(platformKey))
                && publishers.stream().anyMatch(p -> p.platformKey().equals(platformKey));
    }

    /** Synchronously marks the platform PENDING so a double-click cannot dispatch it twice. */
    public void markPending(String postId, String platformKey) {
        setStatus(postId, platformKey, PlatformPublishStatus.PENDING, null, null, null, null, null);
    }

    @Async
    public void publish(String postId, String platformKey, ParsedPost parsedPost, PlatformCredentials creds) {
        PlatformFormatter formatter = formatters.stream()
                .filter(f -> f.platformKey().equals(platformKey)).findFirst().orElse(null);
        PlatformPublisher publisher = publishers.stream()
                .filter(p -> p.platformKey().equals(platformKey)).findFirst().orElse(null);
        if (formatter == null || publisher == null) {
            setStatus(postId, platformKey, PlatformPublishStatus.FAILED, null, null,
                    "Publishing to " + platformKey + " is not supported yet", null, null);
            recomputePostStatus(postId);
            return;
        }

        String lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                FormattedContent content = formatter.format(parsedPost);
                PublishResult result = publisher.publish(content, creds);
                if (result.success()) {
                    setStatus(postId, platformKey, PlatformPublishStatus.PUBLISHED, result.url(),
                            result.platformId(), null, result.threadIds(), LocalDateTime.now());
                } else {
                    // A definite refusal from the platform (bad token, validation): retrying won't help.
                    setStatus(postId, platformKey, PlatformPublishStatus.FAILED, null, null,
                            result.error(), null, null);
                }
                recomputePostStatus(postId);
                return;
            } catch (Exception e) {
                lastError = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                log.warn("Publish to {} failed for post {} (attempt {}/{}): {}",
                        platformKey, postId, attempt, MAX_ATTEMPTS, lastError);
                if (attempt < MAX_ATTEMPTS) {
                    try {
                        Thread.sleep(2000L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        setStatus(postId, platformKey, PlatformPublishStatus.FAILED, null, null, lastError, null, null);
        recomputePostStatus(postId);
    }

    private void setStatus(String postId, String platformKey, PlatformPublishStatus status, String url,
                           String platformId, String error, List<String> threadIds, LocalDateTime publishedAt) {
        PlatformStatus value = new PlatformStatus(status, url, platformId, publishedAt, error, threadIds);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(postId)),
                new Update().set("platforms." + platformKey, value).set("updatedAt", LocalDateTime.now()),
                Post.class);
    }

    /**
     * Once nothing is in flight: PUBLISHED if at least one platform succeeded, FAILED if every
     * attempted platform failed. Leaves DRAFT/SCHEDULED posts alone.
     */
    void recomputePostStatus(String postId) {
        Post post = mongoTemplate.findById(postId, Post.class);
        if (post == null || post.platforms() == null) return;
        if (!"PUBLISHED".equals(post.status()) && !"FAILED".equals(post.status())) return;
        boolean pending = post.platforms().values().stream()
                .anyMatch(s -> s != null && s.status() == PlatformPublishStatus.PENDING);
        if (pending) return;
        boolean anyPublished = post.platforms().values().stream()
                .anyMatch(s -> s != null && s.status() == PlatformPublishStatus.PUBLISHED);
        boolean anyFailed = post.platforms().values().stream()
                .anyMatch(s -> s != null && s.status() == PlatformPublishStatus.FAILED);
        String next = anyPublished ? "PUBLISHED" : anyFailed ? "FAILED" : post.status();
        if (!next.equals(post.status())) {
            mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(postId)),
                    new Update().set("status", next), Post.class);
        }
    }
}
