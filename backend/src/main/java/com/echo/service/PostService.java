package com.echo.service;

import com.echo.dto.PostAutosaveRequest;
import com.echo.dto.PostCreateRequest;
import com.echo.dto.PostResponse;
import com.echo.dto.PreviewResponse;
import com.echo.dto.PublishRequest;
import com.echo.dto.VersionSummary;
import com.echo.exception.ResourceNotFoundException;
import com.echo.model.PlatformStatus;
import com.echo.model.PlatformStatus.PlatformPublishStatus;
import com.echo.model.Post;
import com.echo.model.PostVersion;
import com.echo.model.PostVersion.Reason;
import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.ParsedPost;
import com.echo.platform.common.PlatformCredentials;
import com.echo.platform.common.PlatformFormatter;
import com.echo.repository.PlatformCredentialRepository;
import com.echo.repository.PostRepository;
import com.echo.security.EncryptionService;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Post business logic. Every public method is scoped to {@code userId}: a user can only ever see
 * or change their own posts.
 */
@Service
public class PostService {

    private static final Logger log = LoggerFactory.getLogger(PostService.class);
    static final List<String> PLATFORM_KEYS = List.of("devto", "hashnode", "twitter", "linkedin", "medium");

    private final PostRepository postRepository;
    private final VersionService versionService;
    private final PlatformPublishService publishService;
    private final MongoTemplate mongoTemplate;
    private final List<PlatformFormatter> formatters;
    private final PlatformCredentialsProvider credentialsProvider;
    private final PlatformCredentialRepository credentialRepository;
    private final EncryptionService encryptionService;
    private final Parser markdownParser = Parser.builder().build();

    public PostService(PostRepository postRepository,
                       VersionService versionService,
                       PlatformPublishService publishService,
                       MongoTemplate mongoTemplate,
                       List<PlatformFormatter> formatters,
                       PlatformCredentialsProvider credentialsProvider,
                       PlatformCredentialRepository credentialRepository,
                       EncryptionService encryptionService) {
        this.postRepository = postRepository;
        this.versionService = versionService;
        this.publishService = publishService;
        this.mongoTemplate = mongoTemplate;
        this.formatters = formatters;
        this.credentialsProvider = credentialsProvider;
        this.credentialRepository = credentialRepository;
        this.encryptionService = encryptionService;
    }

    // ── Reads ────────────────────────────────────────────────────────────────

    public List<PostResponse> getAllPosts(String userId) {
        return postRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream().map(PostResponse::from).toList();
    }

    public PostResponse getPost(String userId, String id) {
        return PostResponse.from(owned(userId, id));
    }

    // ── Create / autosave / delete ───────────────────────────────────────────

    public PostResponse createPost(String userId, PostCreateRequest request) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, PlatformStatus> platforms = new LinkedHashMap<>();
        for (String key : PLATFORM_KEYS) {
            platforms.put(key, new PlatformStatus(PlatformPublishStatus.NOT_STARTED, null, null, null, null, null));
        }
        Post post = Post.builder()
                .userId(userId)
                .title(request.getTitle())
                .bodyMarkdown(request.getBodyMarkdown() != null ? request.getBodyMarkdown() : "")
                .structuredContent(request.getStructuredContent())
                .tags(request.getTags() != null ? request.getTags() : List.of())
                .coverImageUrl(request.getCoverImageUrl())
                .sourceUrl(request.getSourceUrl())
                .status("DRAFT")
                .createdAt(now).updatedAt(now).lastAutosavedAt(now)
                .platforms(platforms)
                .build();
        return PostResponse.from(postRepository.save(post));
    }

    /**
     * Updates the working copy with targeted {@code $set}s (so a concurrent platform-status update is
     * never overwritten) and takes a checkpoint when warranted.
     */
    public PostResponse autosave(String userId, String id, PostAutosaveRequest request) {
        owned(userId, id);
        LocalDateTime now = LocalDateTime.now();
        Update update = new Update()
                .set("bodyMarkdown", request.bodyMarkdown())
                .set("updatedAt", now)
                .set("lastAutosavedAt", now);
        if (request.title() != null) update.set("title", request.title());
        if (request.structuredContent() != null) update.set("structuredContent", request.structuredContent());
        if (request.tags() != null) update.set("tags", request.tags());
        if (request.platformOverrides() != null) update.set("platformOverrides", request.platformOverrides());
        setOrClear(update, "coverImageUrl", request.coverImageUrl());
        setOrClear(update, "metaDescription", request.metaDescription());
        setOrClear(update, "canonicalUrl", request.canonicalUrl());
        setOrClear(update, "seoImageUrl", request.seoImageUrl());
        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(id).and("userId").is(userId)), update, Post.class);

        Post saved = owned(userId, id);
        versionService.checkpoint(saved, Reason.AUTO, null);
        return PostResponse.from(saved);
    }

    private static void setOrClear(Update update, String field, String value) {
        if (value == null) return;
        if (value.isBlank()) update.unset(field);
        else update.set(field, value);
    }

    public void deletePost(String userId, String id) {
        Post post = owned(userId, id);
        postRepository.deleteById(post.id());
        versionService.deleteAllFor(post.id());
    }

    // ── Versions ─────────────────────────────────────────────────────────────

    public List<VersionSummary> getVersions(String userId, String postId) {
        owned(userId, postId);
        return versionService.list(postId);
    }

    public PostVersion getVersion(String userId, String postId, String versionId) {
        owned(userId, postId);
        return versionService.get(postId, versionId);
    }

    public PostVersion saveNamedVersion(String userId, String postId, String label) {
        Post post = owned(userId, postId);
        return versionService.checkpoint(post, Reason.MANUAL, label == null || label.isBlank() ? null : label.strip())
                .orElseThrow(() -> new IllegalStateException("Could not create version"));
    }

    public PostVersion updateVersion(String userId, String postId, String versionId, String label, Boolean pinned) {
        owned(userId, postId);
        return versionService.update(postId, versionId, label, pinned);
    }

    /** Checkpoints the current state ("Before restore"), then makes the old version the working copy. */
    public PostResponse restoreVersion(String userId, String postId, String versionId) {
        Post post = owned(userId, postId);
        PostVersion v = versionService.get(postId, versionId);
        versionService.checkpoint(post, Reason.PRE_RESTORE, "Before restore");
        LocalDateTime now = LocalDateTime.now();
        Update update = new Update().set("bodyMarkdown", v.bodyMarkdown() == null ? "" : v.bodyMarkdown())
                .set("updatedAt", now).set("lastAutosavedAt", now);
        if (v.structuredContent() != null) update.set("structuredContent", v.structuredContent());
        else update.unset("structuredContent");
        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(postId)), update, Post.class);
        return PostResponse.from(owned(userId, postId));
    }

    /** Called before the AI replaces text, so the user can always get the original back. */
    public void checkpointBeforeAi(String userId, String postId) {
        versionService.checkpoint(owned(userId, postId), Reason.PRE_AI, "Before AI edit");
    }

    // ── Preview ──────────────────────────────────────────────────────────────

    public PreviewResponse preview(String userId, String postId) {
        Post post = owned(userId, postId);
        ParsedPost parsed = parsed(post, post.bodyMarkdown());
        Map<String, FormattedContent> previews = formatters.stream()
                .collect(Collectors.toMap(PlatformFormatter::platformKey, f -> f.format(parsed)));
        return PreviewResponse.from(previews);
    }

    // ── Publish / schedule ───────────────────────────────────────────────────

    public void publish(String userId, String postId, PublishRequest request) {
        Post post = owned(userId, postId);
        Set<String> targets = request.platforms();
        if (targets == null || targets.isEmpty()) {
            throw new IllegalArgumentException("Select at least one platform");
        }
        for (String key : targets) {
            if (!publishService.isSupported(key)) {
                throw new IllegalArgumentException("Publishing to '" + key + "' is not supported");
            }
        }
        LocalDateTime now = LocalDateTime.now();

        if (request.scheduledAt() != null && request.scheduledAt().isAfter(now)) {
            Update update = new Update().set("status", "SCHEDULED").set("scheduledAt", request.scheduledAt())
                    .set("scheduledPlatforms", targets).set("updatedAt", now);
            if (request.platformOverrides() != null) update.set("platformOverrides", request.platformOverrides());
            mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(postId)), update, Post.class);
            versionService.checkpoint(post, Reason.SCHEDULE, "Scheduled");
            return;
        }

        versionService.checkpoint(post, Reason.PUBLISH, "Published");
        Update update = new Update().set("status", "PUBLISHED").unset("scheduledAt").unset("scheduledPlatforms")
                .set("updatedAt", now);
        if (request.platformOverrides() != null) update.set("platformOverrides", request.platformOverrides());
        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(postId)), update, Post.class);

        Post fresh = owned(userId, postId);
        dispatch(fresh, targets, request.credentials());
    }

    /** Cancels a scheduled post and returns it to drafts. */
    public PostResponse unschedule(String userId, String postId) {
        Post post = owned(userId, postId);
        if (!"SCHEDULED".equals(post.status())) return PostResponse.from(post);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(postId).and("status").is("SCHEDULED")),
                new Update().set("status", "DRAFT").unset("scheduledAt").unset("scheduledPlatforms")
                        .set("updatedAt", LocalDateTime.now()), Post.class);
        return PostResponse.from(owned(userId, postId));
    }

    /** Invoked by the scheduler. Atomically claims the post first so two instances cannot both publish it. */
    public void publishScheduled(Post post) {
        long claimed = mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(post.id()).and("status").is("SCHEDULED")),
                new Update().set("status", "PUBLISHED").set("updatedAt", LocalDateTime.now()),
                Post.class).getModifiedCount();
        if (claimed == 0) return; // someone else got it, or it was unscheduled meanwhile

        Set<String> targets = post.scheduledPlatforms();
        if (targets == null || targets.isEmpty()) {
            // Legacy scheduled posts (before platforms were stored): only publish to connected platforms.
            targets = PLATFORM_KEYS.stream()
                    .filter(k -> credentialRepository.findByUserIdAndPlatform(post.userId(), k)
                            .map(c -> c.connected()).orElse(false))
                    .collect(Collectors.toSet());
        }
        versionService.checkpoint(post, Reason.PUBLISH, "Published (scheduled)");
        dispatch(post, targets, null);
    }

    private void dispatch(Post post, Set<String> targets, Map<String, com.echo.dto.PlatformCredentialsDto> overrides) {
        for (String platformKey : targets) {
            PlatformStatus existing = post.platforms() == null ? null : post.platforms().get(platformKey);
            if (existing != null && (existing.status() == PlatformPublishStatus.PUBLISHED
                    || existing.status() == PlatformPublishStatus.PENDING)) {
                continue; // idempotent: already done or in flight
            }
            PlatformCredentials creds = resolveCredentials(post.userId(), platformKey, overrides);
            String body = post.platformOverrides() != null && post.platformOverrides().containsKey(platformKey)
                    ? post.platformOverrides().get(platformKey) : post.bodyMarkdown();
            publishService.markPending(post.id(), platformKey);
            publishService.publish(post.id(), platformKey, parsed(post, body), creds);
        }
    }

    PlatformCredentials resolveCredentials(String userId, String platformKey,
                                           Map<String, com.echo.dto.PlatformCredentialsDto> overrides) {
        if (overrides != null && overrides.containsKey(platformKey)) {
            return credentialsProvider.getCredentials(platformKey, overrides);
        }
        if (userId != null) {
            var stored = credentialRepository.findByUserIdAndPlatform(userId, platformKey).orElse(null);
            if (stored != null) {
                return new PlatformCredentials(
                        encryptionService.decrypt(stored.encryptedApiKey()),
                        encryptionService.decrypt(stored.encryptedAccessToken()),
                        encryptionService.decrypt(stored.encryptedRefreshToken()),
                        encryptionService.decrypt(stored.encryptedClientId()),
                        encryptionService.decrypt(stored.encryptedClientSecret()));
            }
        }
        return credentialsProvider.getCredentials(platformKey, null);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ParsedPost parsed(Post post, String markdown) {
        Node ast = markdownParser.parse(markdown == null ? "" : markdown);
        return new ParsedPost(post.title(), ast, post.tags(), post.coverImageUrl());
    }

    private Post owned(String userId, String id) {
        return postRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
    }
}
