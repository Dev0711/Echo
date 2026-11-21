package com.echo.service;

import com.echo.service.RetentionPolicy.Meta;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RetentionPolicyTest {

    private static final Instant NOW = Instant.parse("2026-11-21T12:30:00Z");

    private static Meta v(String id, Duration age, boolean pinned) {
        return new Meta(id, NOW.minus(age), pinned);
    }

    @Test
    void keepsEverythingInTheLastHour() {
        var versions = List.of(v("a", Duration.ofMinutes(2), false), v("b", Duration.ofMinutes(10), false),
                v("c", Duration.ofMinutes(59), false));
        assertTrue(RetentionPolicy.selectForDeletion(versions, NOW).isEmpty());
    }

    @Test
    void keepsOnlyNewestPerHourBetweenOneAndTwentyFourHours() {
        // 14:05 and 14:40 fall in the same clock hour: only the newer survives.
        Instant a = Instant.parse("2026-11-21T10:05:00Z");
        Instant b = Instant.parse("2026-11-21T10:40:00Z");
        var versions = List.of(new Meta("old", a, false), new Meta("new", b, false));
        assertEquals(List.of("old"), RetentionPolicy.selectForDeletion(versions, NOW));
    }

    @Test
    void keepsOnlyNewestPerDayBetweenOneAndThirtyDays() {
        Instant a = Instant.parse("2026-11-10T08:00:00Z");
        Instant b = Instant.parse("2026-11-10T20:00:00Z");
        Instant c = Instant.parse("2026-11-09T09:00:00Z");
        var versions = List.of(new Meta("a", a, false), new Meta("b", b, false), new Meta("c", c, false));
        assertEquals(List.of("a"), RetentionPolicy.selectForDeletion(versions, NOW));
    }

    @Test
    void deletesUnpinnedOlderThanThirtyDays() {
        var versions = List.of(v("ancient", Duration.ofDays(45), false));
        assertEquals(List.of("ancient"), RetentionPolicy.selectForDeletion(versions, NOW));
    }

    @Test
    void neverDeletesPinned() {
        var versions = List.of(v("p1", Duration.ofDays(90), true), v("p2", Duration.ofHours(3), true),
                v("p3", Duration.ofHours(3), true));
        assertTrue(RetentionPolicy.selectForDeletion(versions, NOW).isEmpty());
    }

    @Test
    void pinnedVersionDoesNotShadowUnpinnedOneInTheSameBucket() {
        Instant t = Instant.parse("2026-11-21T09:10:00Z");
        var versions = List.of(new Meta("pinned", t, true), new Meta("auto", t.minusSeconds(60), false));
        assertTrue(RetentionPolicy.selectForDeletion(versions, NOW).isEmpty());
    }

    @Test
    void neverDeletesTheNewestVersion() {
        var versions = List.of(v("newest", Duration.ofMinutes(1), false), v("older", Duration.ofMinutes(30), false));
        assertFalse(RetentionPolicy.selectForDeletion(versions, NOW).contains("newest"));
    }
}
