package com.echo.service;

import com.echo.exception.AiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/** Per-user sliding-window limiter so one account cannot burn the shared Gemini quota. */
@Component
public class AiRateLimiter {

    private final int maxRequests;
    private final long windowMillis;
    private final LongSupplier clock;
    private final ConcurrentHashMap<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public AiRateLimiter() {
        this(20, Duration.ofMinutes(1), System::currentTimeMillis);
    }

    AiRateLimiter(int maxRequests, Duration window, LongSupplier clock) {
        this.maxRequests = maxRequests;
        this.windowMillis = window.toMillis();
        this.clock = clock;
    }

    public void check(String userId) {
        long now = clock.getAsLong();
        Deque<Long> q = hits.computeIfAbsent(userId, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() >= windowMillis) q.pollFirst();
            if (q.size() >= maxRequests) {
                throw new AiException(HttpStatus.TOO_MANY_REQUESTS,
                        "You're going a bit fast — please wait a moment before the next AI request.");
            }
            q.addLast(now);
        }
    }
}
