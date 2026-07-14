# Local-First Collaborative Document Editor

A production-grade, highly performant collaborative document workspace designed with a local-first architecture. It features instant rich-text typing powered by TipTap, IndexedDB caching for seamless offline operations, auto-reconnect WebSocket sync via Socket.io, and atomic version rollbacks. By prioritizing client-side data operations first and syncing with PostgreSQL in the background, it provides a desktop-grade editing experience even under unstable network conditions.

---

## Project Overview

### 1. Problem Solved
Traditional document editors rely on constant server round-trips for document state validation and storage. In low-bandwidth or offline environments, this results in input lag, save failures, and lost changes. This project decouples active editing workflows from network reliance by completing operations locally and scheduling background replication.

### 2. Why Local-First Architecture?
- **Zero Input Latency**: Text inputs write immediately to client memory and are persisted to IndexedDB within milliseconds.
- **Offline Resiliency**: Users can create, search, edit, and delete documents with no internet connection.
- **Data Durability**: Unsynced modifications are queued client-side and automatically replicated upon reconnection.

### 3. High-Level Workflow
```
[User Action] ──> [TipTap Editor] ──> [IndexedDB Cache & Sync Queue]
                                             │
                       (Upon Network Status Check: Online)
                                             │
                                             ▼
                      [REST Sync Engine] <───┴───> [Socket.io Realtime Sync]
                               │                               │
                               ▼                               ▼
                     [Sequelize Backend] <──────────> [Socket.io Backend]
                               │
                               ▼
                        [PostgreSQL DB]
```

### 4. Core Design Principles
- **Last Write Wins (LWW)**: Timestamps track absolute operation order, resolving concurrent conflicts deterministically.
- **Optimized Network Footprint**: Throttled updates minimize packet overhead.
- **Progressive Enhancement**: Real-time multi-user features mount seamlessly when connected, without impacting standalone capabilities.

---

## Features

### Authentication
- **JWT Authorization**: Stateless authorization using signed HS256 tokens.
- **Credential Hashing**: Robust password encryption utilizing Bcrypt salts.
- **Route Guards**: Next.js middleware protecting secure `/dashboard` workspace routes.

### Document Management
- **Instant Creation**: Quick-launch blank templates with title and empty canvas.
- **In-Place Updates**: Real-time automatic updates on titles and TipTap document bodies.
- **Atomic Deletions**: Single-click deletions with cascade cleanup on version records.
- **Client-Side Filter**: Instant local search filtering across indexed document libraries.

### Realtime Collaboration
- **Dynamic Rooms**: Automatic Socket.io client joins on room paths.
- **Presence Tracking**: Notion-style collaborative avatar rings showing online user lists.
- **Cursor Sync**: Real-time line highlight tracking indicating where peers are currently editing.

### Offline First
- **IndexedDB Store**: Fast local caching powered by the lightweight `idb` library.
- **Sync Queue Handler**: Persistent storage of local modification updates while offline.
- **Auto Reconciliation**: Automatic bulk-push sync triggered on network restoration.

### Version History
- **Snapshots**: Point-in-time document states containing titles, schemas, and timestamps.
- **Timeline Logs**: Interactive side-panel listing previous versions.
- **Atomic Restores**: Safe database rollback broadcasting changes to active collaborators.

### Security
- **Strict Validation**: Input sanitization and format matching enforced via Zod.
- **RBAC**: Role-Based Access Control enforcing OWNER, EDITOR, and VIEWER permission levels.
- **Database Safety**: Parameterized queries using Sequelize to prevent SQL Injection.

### Performance
- **WebSocket Throttling**: Throttled cursor updates (150ms) to reduce network frames.
- **Search Debouncing**: 200ms debounce on search queries to minimize DOM layout shifts.
- **Relational Indexes**: Optimizations on key database tables for fast collaborator and sync operations.

---

## Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Language** | TypeScript | Standardized type safety across client and server |
| **Framework** | Next.js 14 | App Router structure with server actions and APIs |
| **Styling** | Tailwind CSS / Shadcn | Fast layout configuration |
| **Editor Canvas** | TipTap | ProseMirror-based modular rich-text editor framework |
| **Offline Storage** | IndexedDB (`idb`) | Browser-native transactional database cache |
| **Realtime Sync** | Socket.io | Bidirectional WebSocket messaging protocol |
| **Database** | PostgreSQL | Enterprise relational database |
| **ORM** | Sequelize | Promise-based Node.js ORM mapper |
| **Authentication** | JSON Web Tokens | JSON Web Tokens (HS256) |
| **Validation** | Zod | Runtime validation schemas |

---

## System Architecture

The application is structured around a decoupled frontend UI and a REST/WebSocket backend:

```mermaid
graph TD
    UI[Next.js App UI] -->|Local Writes| IDB[(IndexedDB Cache)]
    UI -->|JSON Operations| ClientAPI[REST Axios client]
    UI -->|Cursor / Updates| WS[Socket.io Client]
    
    ClientAPI -->|REST API Layer| Routes[Next.js App Router API Routes]
    WS -->|WebSocket Layer| Sockets[Socket.io Server Pages Handler]
    
    Routes -->|Business Logic Controllers| Services[Backend Services Layer]
    Sockets -->|Collaborators broadcast| SvcBroadcast[Socket.io Service Manager]
    
    Services -->|Sequelize Models| DB[(PostgreSQL Database)]
```

### Route → Service → Model Architecture
1. **API Router**: Exposes URL routing paths under `/api`, handles requests, and extracts authorization headers.
2. **Middleware**: Enforces JWT verification and maps roles using z-validation guards.
3. **Services Layer**: Isolates core business logic (e.g. creating versions, merging queues) from routes.
4. **Models (Sequelize)**: Maps relational schemas to PostgreSQL tables and executes transaction boundaries.

---

## Folder Structure

```
src/
├── app/                  # Next.js App Router Pages and API Route Handlers
│   ├── api/              # Backend REST API endpoints (auth, docs, sync, versions)
│   ├── auth/             # Login and Signup views
│   └── dashboard/        # Dashboard layout, documents library, and detail page
├── components/           # UI Components
│   ├── documents/        # Editor workspace, presence bar, and history drawers
│   ├── layout/           # Global navbar, sidebar, and headers
│   └── ui/               # Modular shadcn styling items (buttons, inputs, cards)
├── config/               # Database connections and centralized environment setups
├── constants/            # Global message templates and status code catalogs
├── contexts/             # Global React Context providers (AuthContext)
├── hooks/                # Client hooks (useSocket, usePresence, useAutoSave)
├── lib/                  # Library configurations (OpenAPI specs, Tailwind utils)
├── middleware/           # Server-side route handlers (JWT guards, RBAC checks)
├── models/               # Sequelize PostgreSQL model declarations
├── schemas/              # Zod validation schemas
├── services/             # Client-side axios REST services & backend business services
├── types/                # TypeScript shared models
└── utils/                # Standardized errors and response sanitization helpers
```

---

## Database Design

```mermaid
erDiagram
    Users ||--o{ Documents : "creates"
    Users ||--o{ DocumentCollaborators : "role access"
    Users ||--o{ Operations : "performs"
    Users ||--o{ DocumentVersions : "snapshots"
    Users ||--o{ FavoriteDocuments : "favorites"
    Users ||--o{ PinnedDocuments : "pins"
    Users ||--o{ UserDocumentActivity : "activity"

    Documents ||--o{ DocumentCollaborators : "has"
    Documents ||--o{ Operations : "logs"
    Documents ||--o{ DocumentVersions : "captures"
    Documents ||--o{ FavoriteDocuments : "favorited by"
    Documents ||--o{ PinnedDocuments : "pinned by"
    Documents ||--o{ UserDocumentActivity : "tracked by"
    Documents ||--o{ DocumentTags : "tagged with"

    Tags ||--o{ DocumentTags : "applied to"
```

### Table Specifications

1. **`users`** — Account profiles with bcrypt-hashed passwords. Unique index on `email`.

2. **`documents`** — Core document store. JSONB `content` field maps TipTap/ProseMirror schema. Soft-delete fields: `deletedAt`, `deletedBy`, `deletedReason`. Index on `createdBy`.

3. **`document_collaborators`** — RBAC junction table. Composite unique index on `[userId, documentId]`. Roles: `OWNER`, `EDITOR`, `VIEWER`.

4. **`operations`** — Chronological modification log for sync pull. Composite index on `[documentId, timestamp]`.

5. **`document_versions`** — Historical content snapshots. Composite unique index on `[documentId, versionNumber]`.

6. **`favorite_documents`** — User-scoped favorites junction table. Composite unique index on `[userId, documentId]`. Enforces multi-tenant isolation (no global state leakage).

7. **`pinned_documents`** — User-scoped pins junction table. Composite unique index on `[userId, documentId]`.

8. **`user_document_activity`** — Per-user activity tracking. Columns: `lastOpenedAt`, `lastEditedAt`, `lastViewedAt`. Composite unique index on `[userId, documentId]`. Used for Recent Documents ordering.

9. **`tags`** — Global tag registry. Unique constraint on `name` (normalised to lowercase). Prevents duplicates across the tag system.

10. **`document_tags`** — Document-tag many-to-many junction table. Composite unique index on `[documentId, tagId]`.

---

## API Documentation

### Core Endpoints

| Method | Endpoint | Description | Auth | Min Role |
|---|---|---|---|---|
| `GET` | `/api/health` | Service health check | No | — |
| `POST` | `/api/auth/signup` | Register user | No | — |
| `POST` | `/api/auth/login` | Authenticate and get JWT | No | — |
| `GET` | `/api/documents` | List accessible documents | Yes | VIEWER |
| `POST` | `/api/documents` | Create document | Yes | — |
| `GET` | `/api/documents/{id}` | Fetch document | Yes | VIEWER |
| `PUT` | `/api/documents/{id}` | Update document | Yes | EDITOR |
| `DELETE` | `/api/documents/{id}` | Soft-delete document | Yes | OWNER |
| `POST` | `/api/documents/{id}/sync/push` | Push offline operations | Yes | EDITOR |
| `GET` | `/api/documents/{id}/sync/pull` | Pull server changes | Yes | VIEWER |
| `GET` | `/api/documents/{id}/versions` | List version history | Yes | VIEWER |
| `POST` | `/api/documents/{id}/versions` | Create snapshot | Yes | EDITOR |
| `POST` | `/api/documents/{id}/versions/{vId}` | Restore to snapshot | Yes | OWNER |

### Phase 7A Productivity Endpoints

| Method | Endpoint | Description | Auth | Min Role |
|---|---|---|---|---|
| `POST` | `/api/documents/{id}/favorite` | Favorite a document | Yes | VIEWER |
| `DELETE` | `/api/documents/{id}/favorite` | Unfavorite a document | Yes | VIEWER |
| `GET` | `/api/documents/favorites` | List favorites | Yes | — |
| `POST` | `/api/documents/{id}/pin` | Pin a document | Yes | VIEWER |
| `DELETE` | `/api/documents/{id}/pin` | Unpin a document | Yes | VIEWER |
| `GET` | `/api/documents/pinned` | List pinned documents | Yes | — |
| `GET` | `/api/documents/recent` | List recently opened documents | Yes | — |
| `POST` | `/api/documents/{id}/duplicate` | Duplicate a document (with tags) | Yes | EDITOR |
| `GET` | `/api/documents/trash` | List soft-deleted documents | Yes | — |
| `POST` | `/api/documents/{id}/restore` | Restore from trash | Yes | OWNER |
| `DELETE` | `/api/documents/{id}/permanent` | Hard-delete document | Yes | OWNER |
| `GET` | `/api/tags` | List all global tags | Yes | — |
| `POST` | `/api/tags` | Create a tag | Yes | — |
| `POST` | `/api/documents/{id}/tags` | Add tag to document | Yes | EDITOR |
| `DELETE` | `/api/documents/{id}/tags/{tagId}` | Remove tag from document | Yes | EDITOR |
| `GET` | `/api/documents/{id}/export/{format}` | Export as html/markdown/pdf | Yes | VIEWER |

> Complete interactive API documentation: `/docs` (Swagger UI) · Raw OpenAPI spec: `/api/openapi`

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthAPI as REST Auth API
    
    User->>Frontend: Fills Email / Password
    Frontend->>AuthAPI: POST /api/auth/login
    AuthAPI->>AuthAPI: Verify credentials & sign JWT (HS256)
    AuthAPI-->>Frontend: HTTP 200 (JWT token + profile data)
    Frontend->>Frontend: Save JWT in memory / state
    Frontend->>Frontend: Mount Socket.io client (Header: Auth Bearer)
    Frontend->>ClientAPI: Attach Bearer Token to all request headers
```

1. **Stateless Authorization**: JWT contains `userId` payloads signed using `JWT_SECRET`.
2. **Access Guards**: API Route Handler validates token presence in headers.
3. **Session Termination**: Logging out resets the client state and disconnects Socket clients.

---

## Offline Sync Flow

When internet connectivity is lost, the editor queue handles local replication seamlessly:

```mermaid
sequenceDiagram
    participant User
    participant IDB as IndexedDB Queue
    participant Sync as Sync Engine
    participant Server as REST Server
    
    Note over User, Server: Connection Status: OFFLINE
    User->>IDB: Edits text -> caches document content
    User->>IDB: Enqueues edit operation payload
    Note over User, Server: Connection Status: ONLINE
    Sync->>IDB: Read unsynced queue operations
    Sync->>Server: POST /api/documents/:id/sync/push (bulk operations payload)
    Server->>Server: Run operations database transaction
    Server-->>Sync: Sync acknowledgement (Success)
    Sync->>IDB: Clear synced queue operations
```

### Conflict Resolution Strategy (LWW)
Conflicts are resolved using a **Last Write Wins** strategy. Client modifications include a high-precision timestamp. When merging client operations, the server evaluates database records; operations with higher timestamps overwrite older values.

---

## Realtime Collaboration Flow

Multi-user sync is managed through dynamic WebSocket rooms in Socket.io:

```mermaid
sequenceDiagram
    participant PeerA as User A
    participant Svc as Socket.io Server
    participant PeerB as User B
    
    PeerA->>Svc: join-document (Room: doc-id)
    Svc-->>PeerB: user-joined (ID, Name, Cursor: Line 1)
    PeerB-->>PeerA: cursor-update (Self-announcement response)
    PeerA->>Svc: document-operation (Title update or editor payload)
    Svc-->>PeerB: document-operation (Broadcast updates)
```

1. **Room Join**: Accessing a document URL triggers a room join.
2. **Peer Discovery**: Joining clients emit their cursor positions, prompting active peers to reply with theirs.
3. **Operational Sync**: Collaborative keystrokes emit change operations to room subscribers. Programmatic updates on peers set `emitUpdate: false` inside TipTap to prevent feedback loops.

---

## Version History Flow

Snapshots capture the state of the document at a specific point in time:

```mermaid
graph TD
    A[User triggers snapshot] --> B[Save document state under versions table]
    B --> C[Assign versionNumber increment]
    
    D[User clicks Restore] --> E[Fetch version snapshot payload]
    E --> F[Database Transaction: Revert documents title/content]
    F --> G[Client Refresh: Re-load TipTap Workspace]
    G --> H[Emit WebSocket: Broadcast rollback state to all peers]
```

- **Rollback Sync**: Reverting to a version forces all connected clients to reload the document content programmatically without cursor jumps.

---

## Installation

### 1. Prerequisites
- **Node.js**: `v18.x` or later
- **PostgreSQL**: `v14.x` or later

### 2. Setup Steps
```bash
# Clone the repository
git clone https://github.com/Yashhirudkar/workspace-collaboration-platform.git
cd workspace-collaboration-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Database Initialization
Create a PostgreSQL database matching the name in your `.env`. On project startup, Sequelize will synchronize schemas, tables, and constraints automatically.

---

## Environment Variables

Configure these settings in your local `.env` file:

| Variable | Description | Example Value |
|---|---|---|
| `NODE_ENV` | Mode of operation | `development` / `production` |
| `PORT` | Local port number | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:password@localhost:5432/local_first_docs` |
| `JWT_SECRET` | Secret key used for signing JWTs | `super-secret-jwt-key-for-dev` |
| `JWT_EXPIRES_IN` | JWT token expiration lifespan | `7d` / `24h` |

---

## Running the Project

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Validation Checks
```bash
# Run ESLint validation
npm run lint

# Run TypeScript compiler diagnostics
npm run type-check
```

---

## Screenshots

- **Login Screen**: `docs/screenshots/login.png`  
- **Signup Screen**: `docs/screenshots/signup.png`  
- **Dashboard Workspace**: `docs/screenshots/dashboard.png`  
- **Documents Library**: `docs/screenshots/documents.png`  
- **TipTap Workspace**: `docs/screenshots/editor.png`  
- **Realtime Collaboration (Presence & Highlights)**: `docs/screenshots/realtime.png`  
- **Version Timeline Drawer**: `docs/screenshots/history.png`  
- **Interactive API Documentation UI**: `docs/screenshots/swagger.png`  

---

## Performance Optimizations

1. **Search Debouncing**: Incorporates a 200ms debounce loop on document library searches, limiting DOM calculations.
2. **WebSocket Throttling**: Throttles cursor position broadcasts to 150ms intervals, reducing network traffic.
3. **Database Indexing**: Relational indexing on table foreign keys accelerates relational check performance.
4. **TipTap Content Guard**: Diff-checks local editor structures with incoming payloads before updating to prevent cursor jumps.

---

## Security

1. **Strict Input Matching**: Type-enforced parameters and schemas validated through Zod.
2. **Role-Based Access Control (RBAC)**: Validates client permission boundaries (OWNER/EDITOR/VIEWER).
3. **SQL Injection Resistance**: Enforces query parameterization via Sequelize ORM.
4. **XSS Protection**: HTML sanitization checks within TipTap text parser.

---

## Phase 7A – Enterprise Productivity Features

This release extends the platform with multi-tenant productivity modules. Every feature follows the established RBAC patterns and uses atomic database transactions.

### Favorites & Pins

Document interactions are tracked in dedicated junction tables (`favorite_documents`, `pinned_documents`) scoped strictly to the `userId`. This prevents the multi-tenant state collision problem where a global `isFavorited` column on `Document` would expose one user's private data to another.

```mermaid
sequenceDiagram
    participant User
    participant API as REST API
    participant RBAC as RBAC Middleware
    participant DB as PostgreSQL

    User->>API: POST /documents/{id}/favorite
    API->>RBAC: checkDocumentRole(userId, docId, [OWNER,EDITOR,VIEWER])
    RBAC-->>API: Authorized
    API->>DB: FavoriteDocument.findOrCreate({ userId, documentId })
    DB-->>API: Row created / already exists
    API-->>User: 200 OK
```

### Recent Documents

The `user_document_activity` table upserts on every `GET /documents/{id}` (view) and `PUT /documents/{id}` (edit). The `/recent` endpoint orders by `lastOpenedAt DESC` and limits to 20 rows.

### Duplicate Document

Executed inside a single Sequelize transaction:
1. Clone document content and title (`+ " (Copy)"`).
2. Insert requesting user as `OWNER` of the copy.
3. Optionally copy `DocumentCollaborator` rows (excluding the duplicating user).
4. Copy `DocumentTag` associations.
5. `COMMIT` or full `ROLLBACK` on any failure.

### Trash (Soft Delete)

The `DELETE /documents/{id}` endpoint sets `deletedAt = NOW()` instead of removing the row. All list endpoints filter `deletedAt IS NULL`. The trash queue (`GET /documents/trash`) shows only documents owned by the requesting user. `POST /restore` clears the soft-delete fields. `DELETE /permanent` performs the actual hard-delete.

### Tags

Tags are a global registry (`tags` table) normalised to lowercase. Documents attach tags via `document_tags` junction rows. OWNER and EDITOR roles can add/remove tags. VIEWER and above can read them.

### Export

A TipTap JSON document tree is recursively serialised to the requested format server-side:
- **HTML**: Full `<!DOCTYPE html>` document with embedded CSS.
- **Markdown**: Headings, paragraphs, lists, and code blocks preserved.
- **PDF**: Valid PDF/1.4 binary generated without external dependencies using a custom minimal PDF writer.

Export requires at least `VIEWER` access. Unsupported formats are rejected immediately via Zod enum validation before any DB query is executed.

---

## Future Improvements
- **CRDT Support**: Transition from LWW conflict resolution to Y.js for deep character-by-character real-time merges.
- **Inline Comments**: Multi-user conversational sidebar markers linked to text spans.
- **File Export**: Print layouts to standard PDF/HTML formats.
- **Collaborative Selections**: Live highlight selections colored according to peers' cursors.

---

## Contributing
1. Fork this repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Create a Pull Request.

---

## License
Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

---

## Author
**Yash Hirudkar**  
[GitHub Profile](https://github.com/Yashhirudkar)
