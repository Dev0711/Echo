# Echo — Cross-Posting Content Platform

Write once, publish everywhere. A personal tool to author an article in Markdown and publish it to Dev.to, Hashnode, X/Twitter, LinkedIn, and Medium — each platform gets content reshaped to fit its format.

## Features (MVP)

- **Write once in Markdown** — Full CommonMark + extensions support
- **Auto-save drafts** — Continuous saving without publishing
- **Import from URL** — Extract content from existing articles
- **Per-platform preview** — See exactly how your post will look on each platform
- **Smart formatting** — Each platform gets optimized content (threads for X, plain text for LinkedIn, etc.)
- **Idempotent publishing** — Retry failed platforms without re-publishing successful ones
- **Media handling** — Upload images to your own storage (R2/B2), re-upload per platform at publish time

## Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Backend        | Spring Boot 3.4.x (Java 21)                        |
| Database       | MongoDB (Atlas M0 free tier)                       |
| Frontend       | Next.js 14 (React, TypeScript)                     |
| Object Storage | Cloudflare R2 / Backblaze B2 (S3-compatible)       |
| Markdown       | flexmark-java (AST-based parsing)                  |
| AI Assistance  | Anthropic API (Claude)                             |
| Hosting (Free) | Render (backend), Vercel (frontend), MongoDB Atlas |

## Quick Start

### Prerequisites

- Java 21+
- Node.js 20+
- MongoDB (local or Atlas)
- Maven 3.9+

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and API keys
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`
API docs at `http://localhost:8080/swagger-ui.html`

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Project Structure

```
echo/
├── backend/                 # Spring Boot application
│   ├── src/main/java/com/echo/
│   │   ├── controller/      # REST endpoints
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── exception/       # Custom exceptions & handler
│   │   ├── mapper/          # MapStruct mappers
│   │   ├── model/           # MongoDB documents
│   │   ├── platform/        # Platform adapters
│   │   │   ├── common/      # Shared interfaces
│   │   │   ├── devto/       # Dev.to adapter
│   │   │   ├── hashnode/    # Hashnode adapter
│   │   │   ├── twitter/     # X/Twitter adapter
│   │   │   ├── linkedin/    # LinkedIn adapter
│   │   │   └── medium/      # Medium adapter
│   │   ├── repository/      # MongoDB repositories
│   │   └── service/         # Business logic
│   └── src/main/resources/
│       └── application.yml  # Configuration
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities, API client, store
│   │   └── types/           # TypeScript types
│   └── package.json
└── docs/
    ├── architecture.md      # System architecture
    └── decisions.md         # Design decisions log
```

## Documentation

- [Architecture](docs/architecture.md) — System design and component responsibilities
- [Decisions](docs/decisions.md) — Log of non-obvious design choices
- [API Docs](http://localhost:8080/swagger-ui.html) — Auto-generated OpenAPI spec

## Development

### Backend Commands

```bash
cd backend
mvn clean compile          # Compile
mvn test                   # Run tests
mvn spotless:apply         # Format code (Google Java Style)
mvn spotless:check         # Check formatting
```

### Frontend Commands

```bash
cd frontend
npm run dev                # Development server
npm run build              # Production build
npm run lint               # ESLint
npm run format             # Prettier
npm run type-check         # TypeScript check
```

## Environment Variables

See `.env.example` in both `backend/` and `frontend/`.

### Required for Backend

| Variable                | Description                         |
| ----------------------- | ----------------------------------- |
| `MONGODB_URI`           | MongoDB connection string           |
| `DEVTO_API_KEY`         | Dev.to API key                      |
| `HASHNODE_ACCESS_TOKEN` | Hashnode Personal Access Token      |
| `ANTHROPIC_API_KEY`     | Anthropic API key (for AI features) |

### Optional for Backend

| Variable                 | Description                  |
| ------------------------ | ---------------------------- |
| `TWITTER_API_KEY`        | X API Key                    |
| `TWITTER_API_SECRET`     | X API Secret                 |
| `LINKEDIN_CLIENT_ID`     | LinkedIn OAuth Client ID     |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth Client Secret |
| `MEDIA_STORAGE_TYPE`     | `local`, `r2`, or `b2`       |

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Editor     │────▶│  MongoDB     │────▶│  Transform      │
│  (Next.js)  │     │  (posts,     │     │  Layer          │
│             │     │  versions)   │     │  (formatters)   │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌────────▼────────┐
                    │  Platform    │◀────│  Job Dispatch   │
                    │  Publishers  │     │  (@Async)       │
                    └──────────────┘     └─────────────────┘
```

## Contributing

This is a personal project, but PRs are welcome for:

- Bug fixes
- New platform adapters
- Documentation improvements

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code restructuring

## License

MIT — Use freely for personal or commercial projects.
