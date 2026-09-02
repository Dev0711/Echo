# Design Decisions

## 1. Markdown Parsing Strategy

**Decision**: Parse Markdown to AST once, render per platform

**Why**:

- Ensures consistent content across platforms
- Avoids re-parsing for each platform
- Flexmark's AST provides rich structure for formatting
- Single parse point of failure (vs. multiple parsers)

**Alternatives Considered**:

- Parse per platform (more consistent but slower)
- Use a simpler parser (less features, less control)

**Tradeoffs**:

- AST parsing adds complexity
- Requires careful handling of AST traversal

**Date**: 2026-09-02

## 2. Platform Adapter Pattern

**Decision**: Use Spring's `@Component` discovery for platform adapters

**Why**:

- No registry maintenance (Spring auto-wires `List<PlatformFormatter>`)
- New platforms = new classes, no existing code changes
- Clear separation of concerns

**Alternatives Considered**:

- Manual registry pattern
- Factory pattern

**Tradeoffs**:

- Requires Spring context awareness
- Platforms must be Spring components

**Date**: 2026-09-02

## 3. MongoDB Schema Design

**Decision**: Embedded platform status in posts collection

**Why**:

- Atomic updates for publish status
- Avoids complex joins for common queries
- Status updates are frequent, posts are read often

**Alternatives Considered**:

- Separate `platform_status` collection
- Document-per-platform status

**Tradeoffs**:

- Post documents grow with platforms
- Need to manage document size

**Date**: 2026-09-02

## 4. Autosave Implementation

**Decision**: Debounced client-side with periodic server-side saves

**Why**:

- Reduces server load
- Provides good user experience (3-5s debounce)
- Periodic saves ensure no data loss

**Alternatives Considered**:

- Server-side only autosave
- Client-side only autosave

**Tradeoffs**:

- Requires coordination between client and server
- Need to handle conflicts (last-write-wins)

**Date**: 2026-09-02

## 5. Twitter Thread Splitting Algorithm

**Decision**: Greedy packing with continuation suffixes

**Why**:

- Preserves natural paragraph boundaries
- Maintains readability
- Handles edge cases gracefully

**Alternatives Considered**:

- Fixed-size chunks
- Sentence-level splitting

**Tradeoffs**:

- May exceed 280 chars occasionally
- Requires AI fallback for very long sentences

**Date**: 2026-09-02

## 6. LinkedIn Unicode Bold Conversion

**Why**:

- LinkedIn API has no rich Markdown support
- Unicode bold is the only reliable option
- Preserves readability

**Alternatives Considered**:

- Plain text bold
- HTML bold (not supported by LinkedIn)

**Tradeoffs**:

- Unicode bold may not render on all devices
- Requires fallback to plain text

**Date**: 2026-09-02

## 7. Medium Publishing Flow

**Decision**: Manual-assist with copy button

**Why**:

- Medium API is unreliable for new accounts
- Provides good user experience
- No API key required

**Alternatives Considered**:

- Attempt to use API (unreliable)
- Require user to manually upload

**Tradeoffs**:

- Less automated than other platforms
- Requires user interaction

**Date**: 2026-09-02

## 8. Error Handling Strategy

**Decision**: Global exception handler with consistent error responses

**Why**:

- Consistent error format across all endpoints
- Proper HTTP status codes
- Detailed error messages for debugging

**Alternatives Considered**:

- Let Spring Boot default error handling
- Custom error handling per controller

**Tradeoffs**:

- Requires more initial setup
- More consistent than defaults

**Date**: 2026-09-02

## 9. Deployment Architecture

**Decision**: Free tier services with UptimeRobot mitigation

**Why**:

- Cost-effective for personal use
- Simple to set up
- Provides good uptime

**Alternatives Considered**:

- Paid services
- Self-hosted infrastructure

**Tradeoffs**:

- Render spins down after 15 min idle
- Requires monitoring

**Date**: 2026-09-02

## 10. Frontend State Management

**Decision**: Zustand with localStorage persistence

**Why**:

- Lightweight and flexible
- Good performance
- Simple API

**Alternatives Considered**:

- React Context
- Redux
- Jotai

**Tradeoffs**:

- Requires careful state normalization
- More boilerplate than Context

**Date**: 2026-09-02
