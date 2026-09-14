<div align="center">
  <h1>🚀 Echo Platform</h1>
  <p><strong>Write once, publish everywhere.</strong></p>
  <p>A unified content creation platform that lets you author in Markdown and intelligently reshape and publish your content across Dev.to, Hashnode, X (Twitter), LinkedIn, and Medium.</p>
</div>

---

## ✨ Key Features

- ✍️ **Write Once in Markdown** — Full CommonMark + extensions support. Use a rich block-based editor or raw Markdown.
- 🔄 **Auto-Save & Version History** — Never lose a draft. Continuous background saving and full version control.
- 🤖 **AI Assistant Built-in** — Fix grammar, generate tags, write summaries, and improve introductions using Gemini AI directly in the editor.
- 📱 **Per-Platform Previews** — See exactly how your post will render on Dev.to, Twitter (threads), LinkedIn, etc., before you hit publish.
- ⚡ **Idempotent Publishing** — If a platform fails to publish, just retry. Echo remembers where it succeeded.
- 🖼️ **Seamless Media Handling** — Upload images seamlessly with integrated Cloudinary support.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Backend** | Spring Boot 3.4.x (Java 21) |
| **Database** | MongoDB (Atlas M0 free tier) |
| **Frontend** | Next.js 14 (React, TypeScript, TailwindCSS) |
| **Markdown** | flexmark-java (AST-based parsing), BlockNote |
| **AI Integration** | Google Gemini (v1beta / 3.6-flash) |
| **Hosting** | Render (backend), Vercel (frontend), MongoDB Atlas |

---

## 🚀 Quick Start

### Prerequisites

- **Java 21+**
- **Node.js 20+**
- **MongoDB** (local or Atlas)
- **Maven 3.9+**

### 1️⃣ Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and API keys
mvn spring-boot:run
```
> **Note:** The backend runs on `http://localhost:8080`. API documentation is available at `http://localhost:8080/swagger-ui.html`.

### 2️⃣ Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
> **Note:** The frontend runs on `http://localhost:3000`.

---

## 📁 Project Structure

```text
echo/
├── backend/                 # Spring Boot application
│   ├── src/main/java/com/echo/
│   │   ├── controller/      # REST endpoints
│   │   ├── model/           # MongoDB documents
│   │   ├── platform/        # Platform adapters (Dev.to, Twitter, etc.)
│   │   ├── service/         # Business logic & AI Integration
│   │   └── security/        # JWT & OAuth2 Security
│   └── src/main/resources/
│       └── application.yml  # Configuration
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages (Dashboard, Login)
│   │   ├── components/      # React components (BlockEditor, AiAssistant)
│   │   └── lib/             # Utilities, API client, Zustand store
│   └── package.json
└── docs/                    # Architecture & Design documentation
```

---

## 🔑 Environment Variables

See `.env.example` in both `backend/` and `frontend/` directories.

### Required Backend Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key (for AI features) |
| `JWT_SECRET` | Secret key for JWT signing |

### Optional Backend Variables

| Variable | Description |
| --- | --- |
| `DEVTO_API_KEY` | Dev.to API key |
| `HASHNODE_ACCESS_TOKEN` | Hashnode Personal Access Token |
| `TWITTER_API_KEY` | X (Twitter) API Key |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth Client ID |

---

## 🏗️ Architecture Overview

```mermaid
graph LR
    A[Editor (Next.js)] -->|Saves Markdown| B(MongoDB)
    A -->|Publish Request| C{Transform Layer}
    C -->|Thread formatting| D[Twitter/X]
    C -->|HTML/MD formatting| E[Dev.to]
    C -->|Plain text formatting| F[LinkedIn]
```

---

## 🤝 Contributing

This is a personal project, but PRs are welcome for:
- Bug fixes
- New platform adapters
- Documentation improvements

Please follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation

---

## 📄 License

**MIT** — Use freely for personal or commercial projects.
