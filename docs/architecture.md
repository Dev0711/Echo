# Echo Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Editor     │  │  Dashboard   │  │   Preview    │  │  Settings  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                 │         │
│         └─────────────────┼─────────────────┼─────────────────┘         │
│                           ▼                 ▼                           │
│                  ┌─────────────────────────────────────┐               │
│                  │          API Client (axios)         │               │
│                  └─────────────────────┬───────────────┘               │
└────────────────────────────────────────┼───────────────────────────────┘
                                         │ HTTPS/REST
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Spring Boot)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     REST Controllers                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │  Posts   │  │  Media   │  │  Import  │  │  Publish     │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │   │
│  └───────┼─────────────┼─────────────┼─────────────┼────────────┘   │
│          │             │             │             │                │
│          ▼             ▼             ▼             ▼                │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                        Services                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │  Post    │  │  Media   │  │  Import  │  │  Publish     │  │ │
│  │  │  Service │  │  Service │  │  Service │  │  Orchestrator│  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┬───────┘  │ │
│  └────────────────────────────────────────────────────┼───────────┘ │
│                                                       │             │
│          ┌────────────────────────────────────────────┼────────┐   │
│          │              Transform Layer               │        │   │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │        │   │
│          │  │  Parser  │ │Formatters│ │Publisher │   │        │   │
│          │  │(flexmark)│ │ (per     │ │ (per     │   │        │   │
│          │  │          │ │ platform)│ │ platform)│   │        │   │
│          │  └──────────┘ └──────────┘ └──────────┘   │        │   │
│          └────────────────────────────────────────────┼────────┘   │
│                                                       │             │
│          ┌────────────────────────────────────────────┼────────┐   │
│          │              Data Access                   │        │   │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │        │   │
│          │  │  Post    │ │  Version │ │  Media   │   │        │   │
│          │  │  Repo    │ │  Repo    │ │  Repo    │   │        │   │
│          │  └──────────┘ └──────────┘ └──────────┘   │        │   │
│          └────────────────────────────────────────────┼────────┘   │
└───────────────────────────────────────────────────────┼────────────┘
                                                        │
                    ┌───────────────────────────────────┼────────────┐
                    │            EXTERNAL SERVICES      │            │
                    │  ┌──────────┐ ┌──────────┐ ┌─────┴─────┐     │
                    │  │  MongoDB │ │  R2/B2   │ │ Platform  │     │
                    │  │  Atlas   │ │ Storage  │ │ APIs      │     │
                    │  └──────────┘ └──────────┘ └───────────┘     │
                    └──────────────────────────────────────────────┘
```

## Component Responsibilities

### Frontend (Next.js)

| Component           | Responsibility                                        |
| ------------------- | ----------------------------------------------------- |
| **Editor**          | Markdown editing with live preview, autosave, toolbar |
| **Dashboard**       | Post list, creation, selection, status overview       |
| **PreviewPanel**    | Per-platform formatted content preview with copy      |
| **Store (Zustand)** | Client-side state management with persistence         |
| **API Client**      | Typed HTTP client with interceptors                   |

### Backend (Spring Boot)

| Component                       | Responsibility                                                      |
| ------------------------------- | ------------------------------------------------------------------- |
| **PostController**              | REST endpoints for CRUD, autosave, preview, publish                 |
| **PostService**                 | Business logic: create, autosave, versioning, publish orchestration |
| **PostRepository**              | MongoDB data access for posts                                       |
| **VersionService**              | Version checkpoints: dedupe, throttle, pinning, tiered retention    |
| **PlatformPublishService**      | Background per-platform publishing with retry; atomic status writes |
| **AiService / GeminiClient**    | Safe prompts, JSON-mode answers, rate limiting, real error statuses |
| **MediaRepository**             | MongoDB data access for media assets                                |
| **PlatformFormatter**           | Converts parsed AST to platform-specific format                     |
| **PlatformPublisher**           | Publishes formatted content to platform APIs                        |
| **PlatformCredentialsProvider** | Manages API credentials per platform                                |
| **MarkdownParser**              | Parses Markdown to flexmark AST (single parse)                      |

### Data Layer (MongoDB)

| Collection      | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `posts`         | Canonical post documents with per-platform status    |
| `post_versions` | Checkpoints per post (auto + pinned); TTL-expired      |
| `media`         | Media asset metadata (URL, alt text, post reference) |

### Platform Adapters

Each platform has a **Formatter** and **Publisher** pair:

| Platform  | Formatter                 | Publisher     | Auth Type  |
| --------- | ------------------------- | ------------- | ---------- |
| Dev.to    | HTML rendering            | REST API      | API Key    |
| Hashnode  | HTML + tag mapping        | GraphQL       | PAT        |
| X/Twitter | Thread chunking           | REST API v2   | OAuth 1.0a |
| LinkedIn  | Plain text + Unicode bold | UGC Post API  | OAuth 2.0  |
| Medium    | HTML rendering            | Manual assist | N/A        |

## Data Flow

### 1. Create Post

```
User → Editor → POST /api/posts → PostService.create() → MongoDB → PostResponse
```

### 2. Autosave

```
Editor (debounced 1s) → PATCH /api/posts/{id}/autosave → PostService.autosave()
  → MongoDB partial $set on the working copy (never touches platform status)
  → VersionService.checkpoint(AUTO): only if content changed AND ≥2 min since the last one
```

Version history is a set of **checkpoints**, not a copy per keystroke:

| Reason        | Created when                                   | Retention                          |
| ------------- | ---------------------------------------------- | ---------------------------------- |
| `AUTO`        | content changed, ≥ 2 min since last checkpoint | hourly after 1 h, daily after 24 h, gone after 30 d (`RetentionPolicy` + TTL index) |
| `MANUAL`      | user clicks "Save a version"                   | pinned (kept)                      |
| `PUBLISH` / `SCHEDULE` | right before publishing / scheduling  | pinned                             |
| `PRE_AI`      | right before the AI replaces text              | pinned                             |
| `PRE_RESTORE` | right before restoring an old version          | pinned                             |

Restoring never destroys anything: the current state is checkpointed first. Deleting a post
deletes its versions.

### 3. Preview

```
User clicks Preview → GET /api/posts/{id}/preview → PostService.preview()
  → Parse Markdown once → For each formatter: format(ast) → PreviewResponse
```

### 4. Publish

```
User selects platforms → POST /api/posts/{id}/publish → PostService.publish()
  → For each platform: @Async publishToPlatformAsync()
    → Parse Markdown → Format → Publish → Update platform status in MongoDB
```

## Key Design Patterns

### Adapter Pattern

- `PlatformFormatter` and `PlatformPublisher` interfaces
- New platforms = new `@Component` classes, no existing code changes
- Spring auto-wires `List<PlatformFormatter>` and `List<PlatformPublisher>`

### Single Parse, Multiple Render

- Markdown parsed **once** to flexmark AST
- Each formatter renders from the same AST
- Ensures consistency across platforms

### Idempotent Publishing

- Per-platform status tracked independently
- Skip platforms already `PUBLISHED` or `PENDING`
- `@Retryable` on transient failures only

### Concurrency

- Autosave and publish-status changes use targeted `$set` updates, so they cannot overwrite each other
- Scheduled posts are claimed with a conditional update (`SCHEDULED → PUBLISHED`), so two instances never both publish one

## Security

- **Every `/api/**` endpoint requires a JWT** (401 otherwise); only the OAuth handshake and health checks are public
- **Per-user ownership** — every post query is scoped to the signed-in user's id
- **No secrets in code** — all via environment variables; with the `prod` profile the app refuses to start on the built-in dev secrets
- **AI**: per-user rate limit, size cap, user text passed as delimited data (not instructions)
- **CORS** configured for frontend origin
- **Validation** on all DTOs with Bean Validation
- **Global exception handler** for consistent error responses
- **Rate limiting** awareness in publishers (future)

## Observability

- **Spring Actuator** endpoints: `/actuator/health`, `/actuator/metrics`
- **Structured logging** with SLF4J/Logback
- **OpenAPI/Swagger** at `/swagger-ui.html`
- **Request/response logging** for platform API calls

## Deployment Architecture (Free Tier)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │   Render    │     │  MongoDB    │
│  (Frontend) │────▶│  (Backend)  │────▶│   Atlas M0  │
│  Always on  │     │  Spins down │     │  Always on  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │Cloudflare│   │Backblaze│
              │    R2    │   │    B2   │
              │ (Images) │   │ (Images)│
              └─────────┘   └─────────┘
```

- **Render**: 750 hrs/month free, spins down after 15 min idle
- **Mitigation**: UptimeRobot pings `/actuator/health` every 5 min
- **JVM Tuning**: `-Xmx400m` to fit 512 MB container
