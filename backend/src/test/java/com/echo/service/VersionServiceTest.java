package com.echo.service;

import com.echo.model.Post;
import com.echo.model.PostVersion;
import com.echo.model.PostVersion.Reason;
import com.echo.repository.PostVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VersionServiceTest {

    private PostVersionRepository repo;
    private VersionService service;

    @BeforeEach
    void setUp() {
        repo = mock(PostVersionRepository.class);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        // prune() reads through the Mongo collection; keep it out of these tests.
        service = new VersionService(repo, mock(MongoTemplate.class, RETURNS_DEEP_STUBS)) {
            @Override void prune(String postId, Instant now) { }
        };
    }

    private static Post post(String body) {
        return Post.builder().id("p1").title("T").bodyMarkdown(body).build();
    }

    private static PostVersion existing(Post p, Reason reason, Instant savedAt, boolean pinned) {
        return new PostVersion("v1", p.id(), p.title(), p.bodyMarkdown(), null,
                VersionService.hash(p.title(), p.bodyMarkdown(), null), 1, reason, null, pinned, savedAt, null);
    }

    @Test
    void autoCheckpointSkippedWhenContentUnchanged() {
        Post p = post("hello");
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1"))
                .thenReturn(Optional.of(existing(p, Reason.AUTO, Instant.now().minus(Duration.ofMinutes(10)), false)));
        assertTrue(service.checkpoint(p, Reason.AUTO, null).isEmpty());
        verify(repo, never()).save(any());
    }

    @Test
    void autoCheckpointThrottledWithinTwoMinutes() {
        Post old = post("hello");
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1"))
                .thenReturn(Optional.of(existing(old, Reason.AUTO, Instant.now().minusSeconds(30), false)));
        assertTrue(service.checkpoint(post("hello world"), Reason.AUTO, null).isEmpty());
    }

    @Test
    void autoCheckpointCreatedAfterIntervalWhenContentChanged() {
        Post old = post("hello");
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1"))
                .thenReturn(Optional.of(existing(old, Reason.AUTO, Instant.now().minus(Duration.ofMinutes(5)), false)));
        PostVersion v = service.checkpoint(post("hello world"), Reason.AUTO, null).orElseThrow();
        assertFalse(v.pinnedFlag());
        assertNotNull(v.expireAt(), "unpinned versions must expire");
        assertEquals(2, v.words());
    }

    @Test
    void blankFirstAutosaveIsNotRecorded() {
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1")).thenReturn(Optional.empty());
        assertTrue(service.checkpoint(post(""), Reason.AUTO, null).isEmpty());
    }

    @Test
    void deletingTextIsStillCheckpointed() {
        Post old = post("a long paragraph of text");
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1"))
                .thenReturn(Optional.of(existing(old, Reason.AUTO, Instant.now().minus(Duration.ofMinutes(5)), false)));
        assertTrue(service.checkpoint(post("a"), Reason.AUTO, null).isPresent());
    }

    @Test
    void manualCheckpointIsPinnedAndNeverExpires() {
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1")).thenReturn(Optional.empty());
        PostVersion v = service.checkpoint(post("text"), Reason.MANUAL, "First draft").orElseThrow();
        assertTrue(v.pinnedFlag());
        assertNull(v.expireAt());
        assertEquals("First draft", v.label());
    }

    @Test
    void manualCheckpointOfUnchangedContentPromotesExistingInsteadOfDuplicating() {
        Post p = post("same");
        when(repo.findFirstByPostIdOrderBySavedAtDesc("p1"))
                .thenReturn(Optional.of(existing(p, Reason.AUTO, Instant.now().minusSeconds(5), false)));
        PostVersion v = service.checkpoint(p, Reason.PUBLISH, "Published").orElseThrow();
        assertEquals("v1", v.id());
        assertTrue(v.pinnedFlag());
        assertEquals(Reason.PUBLISH, v.reason());
        ArgumentCaptor<PostVersion> cap = ArgumentCaptor.forClass(PostVersion.class);
        verify(repo, times(1)).save(cap.capture());
    }
}
