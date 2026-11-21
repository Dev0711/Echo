package com.echo.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Tiered retention for automatic version snapshots (pure logic, no I/O):
 *
 * <ul>
 *   <li>last hour: keep everything</li>
 *   <li>1h – 24h: keep the newest snapshot of each hour</li>
 *   <li>1d – 30d: keep the newest snapshot of each day</li>
 *   <li>older than 30 days: delete (the TTL index does this too; this is the safety net)</li>
 *   <li>pinned snapshots (manual / publish / restore) are never touched</li>
 * </ul>
 */
public final class RetentionPolicy {

    public static final Duration KEEP_ALL_WINDOW = Duration.ofHours(1);
    public static final Duration HOURLY_WINDOW = Duration.ofHours(24);
    public static final Duration DAILY_WINDOW = Duration.ofDays(30);

    private RetentionPolicy() {}

    /** Minimal view of a version, so pruning never has to load document bodies. */
    public record Meta(String id, Instant savedAt, boolean pinned) {}

    /** Returns the ids that should be deleted. {@code versions} may be in any order. */
    public static List<String> selectForDeletion(List<Meta> versions, Instant now) {
        List<Meta> newestFirst = new ArrayList<>(versions);
        newestFirst.sort((a, b) -> b.savedAt().compareTo(a.savedAt()));

        Set<String> seenBuckets = new HashSet<>();
        List<String> toDelete = new ArrayList<>();
        for (Meta v : newestFirst) {
            if (v.pinned()) continue;
            Duration age = Duration.between(v.savedAt(), now);
            if (age.compareTo(KEEP_ALL_WINDOW) <= 0) continue;
            if (age.compareTo(DAILY_WINDOW) > 0) {
                toDelete.add(v.id());
                continue;
            }
            long bucket = age.compareTo(HOURLY_WINDOW) <= 0
                    ? v.savedAt().getEpochSecond() / 3600
                    : v.savedAt().getEpochSecond() / 86400;
            String key = (age.compareTo(HOURLY_WINDOW) <= 0 ? "h" : "d") + bucket;
            if (!seenBuckets.add(key)) {
                toDelete.add(v.id());
            }
        }
        return toDelete;
    }

    /** When an unpinned snapshot created at {@code savedAt} should expire. */
    public static Instant expiryFor(Instant savedAt) {
        return savedAt.plus(DAILY_WINDOW);
    }
}
