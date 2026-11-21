package com.echo.service;

import com.echo.dto.VersionSummary;
import com.echo.exception.ResourceNotFoundException;
import com.echo.model.Post;
import com.echo.model.PostVersion;
import com.echo.model.PostVersion.Reason;
import com.echo.repository.PostVersionRepository;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * Version history as <em>checkpoints</em>, not one snapshot per autosave:
 *
 * <ul>
 *   <li>AUTO checkpoints are taken at most every {@link #MIN_AUTO_INTERVAL} and only when the content changed;</li>
 *   <li>MANUAL / PUBLISH / SCHEDULE / PRE_AI / PRE_RESTORE checkpoints are pinned (never expire);</li>
 *   <li>unpinned checkpoints are thinned by {@link RetentionPolicy} and expire via a TTL index.</li>
 * </ul>
 */
@Service
public class VersionService {

    static final Duration MIN_AUTO_INTERVAL = Duration.ofMinutes(2);

    private final PostVersionRepository repository;
    private final MongoTemplate mongoTemplate;

    public VersionService(PostVersionRepository repository, MongoTemplate mongoTemplate) {
        this.repository = repository;
        this.mongoTemplate = mongoTemplate;
    }

    /** Takes a checkpoint of {@code post} if warranted. Returns the stored/updated version, if any. */
    public Optional<PostVersion> checkpoint(Post post, Reason reason, String label) {
        Instant now = Instant.now();
        boolean pinned = reason != Reason.AUTO;
        String hash = hash(post.title(), post.bodyMarkdown(), post.structuredContent());
        Optional<PostVersion> last = repository.findFirstByPostIdOrderBySavedAtDesc(post.id());

        if (last.isPresent() && hash.equals(last.get().contentHash())) {
            if (!pinned) return Optional.empty();
            // Same content as the latest snapshot: promote it instead of storing a duplicate.
            PostVersion l = last.get();
            PostVersion promoted = new PostVersion(l.id(), l.postId(), l.title(), l.bodyMarkdown(),
                    l.structuredContent(), l.contentHash(), l.wordCount(),
                    l.reason() == Reason.AUTO ? reason : l.reason(),
                    label != null ? label : l.label(), true, l.savedAt(), null);
            return Optional.of(repository.save(promoted));
        }

        if (!pinned) {
            boolean blank = isBlank(post.bodyMarkdown()) && isBlank(post.structuredContent());
            if (last.isEmpty() && blank) return Optional.empty();
            if (last.isPresent()
                    && Duration.between(last.get().savedAt(), now).compareTo(MIN_AUTO_INTERVAL) < 0) {
                return Optional.empty();
            }
        }

        PostVersion saved = repository.save(new PostVersion(
                null, post.id(), post.title(), post.bodyMarkdown(), post.structuredContent(),
                hash, countWords(post.bodyMarkdown()), reason, label, pinned, now,
                pinned ? null : RetentionPolicy.expiryFor(now)));
        if (!pinned) prune(post.id(), now);
        return Optional.of(saved);
    }

    public List<VersionSummary> list(String postId) {
        return repository.findByPostIdOrderBySavedAtDesc(postId).stream().map(VersionSummary::from).toList();
    }

    public PostVersion get(String postId, String versionId) {
        return repository.findByIdAndPostId(versionId, postId)
                .orElseThrow(() -> new ResourceNotFoundException("Version", versionId));
    }

    /** Renames and/or pins/unpins a version. Pinned versions never expire. */
    public PostVersion update(String postId, String versionId, String label, Boolean pinned) {
        PostVersion v = get(postId, versionId);
        boolean newPinned = pinned != null ? pinned : v.pinned();
        String newLabel = label != null ? (label.isBlank() ? null : label.strip()) : v.label();
        if (newLabel != null) newPinned = true; // a named version is a keeper
        Instant expireAt = newPinned ? null : RetentionPolicy.expiryFor(v.savedAt());
        return repository.save(new PostVersion(v.id(), v.postId(), v.title(), v.bodyMarkdown(),
                v.structuredContent(), v.contentHash(), v.wordCount(), v.reason(), newLabel,
                newPinned, v.savedAt(), expireAt));
    }

    public void deleteAllFor(String postId) {
        repository.deleteByPostId(postId);
    }

    /** Applies tiered retention using a projection (ids + timestamps only, never the bodies). */
    void prune(String postId, Instant now) {
        List<RetentionPolicy.Meta> metas = new ArrayList<>();
        for (Document d : mongoTemplate.getCollection("post_versions")
                .find(new Document("postId", postId))
                .projection(new Document("savedAt", 1).append("pinned", 1))) {
            if (d.getDate("savedAt") == null) continue;
            metas.add(new RetentionPolicy.Meta(d.getObjectId("_id").toHexString(),
                    d.getDate("savedAt").toInstant(), Boolean.TRUE.equals(d.getBoolean("pinned"))));
        }
        List<String> doomed = RetentionPolicy.selectForDeletion(metas, now);
        if (!doomed.isEmpty()) repository.deleteAllById(doomed);
    }

    static String hash(String title, String body, String structured) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            for (String part : new String[]{title, body, structured}) {
                md.update((part == null ? "" : part).getBytes(StandardCharsets.UTF_8));
                md.update((byte) 0);
            }
            return HexFormat.of().formatHex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    static int countWords(String s) {
        return isBlank(s) ? 0 : s.trim().split("\\s+").length;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
