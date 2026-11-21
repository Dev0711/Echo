package com.echo.model;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.convert.UpdateMapper;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies, without a running MongoDB, the Spring Data mapping assumptions the services rely on.
 */
class MongoMappingTest {

    private MongoMappingContext context;
    private MappingMongoConverter converter;

    @BeforeEach
    void setUp() {
        // Configure like Spring Boot does: java.time types are simple types via MongoCustomConversions.
        MongoCustomConversions conversions = new MongoCustomConversions(List.of());
        context = new MongoMappingContext();
        context.setSimpleTypeHolder(conversions.getSimpleTypeHolder());
        context.afterPropertiesSet();
        converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setCustomConversions(conversions);
        converter.afterPropertiesSet();
    }

    @Test
    void postRoundTripsThroughTheConverterIncludingNewFields() {
        Post post = Post.builder().id("507f1f77bcf86cd799439011").userId("u1").title("T").bodyMarkdown("body")
                .status("SCHEDULED").scheduledAt(LocalDateTime.of(2026, 11, 24, 9, 0))
                .scheduledPlatforms(Set.of("devto", "linkedin"))
                .platforms(Map.of("devto", new PlatformStatus(PlatformStatus.PlatformPublishStatus.PENDING, null, null, null, null, null)))
                .tags(List.of("java")).build();
        Document doc = new Document();
        converter.write(post, doc);
        Post back = converter.read(Post.class, doc);
        assertEquals("u1", back.userId());
        assertEquals(Set.of("devto", "linkedin"), back.scheduledPlatforms());
        assertEquals(PlatformStatus.PlatformPublishStatus.PENDING, back.platforms().get("devto").status());
        assertEquals(post.scheduledAt(), back.scheduledAt());
    }

    @Test
    void toBuilderCopiesEveryField() {
        Post p = Post.builder().id("1").userId("u").title("t").metaDescription("m").canonicalUrl("c").seoImageUrl("s").build();
        Post q = p.toBuilder().status("PUBLISHED").build();
        assertEquals("m", q.metaDescription());
        assertEquals("u", q.userId());
        assertEquals("PUBLISHED", q.status());
    }

    @Test
    void platformStatusSetOnADottedPathSerializesAsAnEmbeddedDocument() {
        PlatformStatus status = new PlatformStatus(PlatformStatus.PlatformPublishStatus.FAILED, null, null, null, "boom", null);
        Update update = new Update().set("platforms.devto", status);
        Document mapped = new UpdateMapper(converter).getMappedObject(update.getUpdateObject(),
                context.getRequiredPersistentEntity(Post.class));
        Document set = mapped.get("$set", Document.class);
        Object value = set.get("platforms.devto");
        assertInstanceOf(Document.class, value, "must be an embedded document, not a Java object");
        assertEquals("FAILED", ((Document) value).get("status"));
        assertEquals("boom", ((Document) value).get("error"));
    }

    @Test
    void versionHasTtlIndexOnExpireAtAndCompoundIndexOnPostAndTime() {
        var resolver = new MongoPersistentEntityIndexResolver(context);
        List<IndexDefinition> indexes = new java.util.ArrayList<>();
        resolver.resolveIndexFor(PostVersion.class).forEach(indexes::add);

        boolean ttl = indexes.stream().anyMatch(i -> i.getIndexKeys().containsKey("expireAt")
                && i.getIndexOptions().containsKey("expireAfterSeconds"));
        boolean compound = indexes.stream().anyMatch(i -> i.getIndexKeys().containsKey("postId")
                && i.getIndexKeys().containsKey("savedAt"));
        assertTrue(ttl, "TTL index on expireAt is what expires unpinned versions");
        assertTrue(compound, "(postId, savedAt) index backs the history query");
    }

    @Test
    void postIsIndexedByUser() {
        var resolver = new MongoPersistentEntityIndexResolver(context);
        boolean userIdx = false;
        for (IndexDefinition i : resolver.resolveIndexFor(Post.class)) userIdx |= i.getIndexKeys().containsKey("userId");
        assertTrue(userIdx);
    }

    @Test
    void versionRoundTripKeepsInstantsAndNullExpiryForPinned() {
        PostVersion v = new PostVersion("507f1f77bcf86cd799439012", "p1", "T", "body", null, "hash", 1,
                PostVersion.Reason.MANUAL, "First draft", true, Instant.parse("2026-11-21T10:00:00Z"), null);
        Document doc = new Document();
        converter.write(v, doc);
        assertNull(doc.get("expireAt"), "pinned versions must not carry an expiry (TTL ignores missing/null)");
        PostVersion back = converter.read(PostVersion.class, doc);
        assertEquals(v.savedAt(), back.savedAt());
        assertEquals(PostVersion.Reason.MANUAL, back.reason());
        assertTrue(back.pinned());
    }
}
