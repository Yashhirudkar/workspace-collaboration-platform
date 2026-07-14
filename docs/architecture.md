# Architecture

The backend follows a standard Controller -> Service -> Model architecture wrapped in a serverless pattern via Next.js App Router, with a hybrid Pages Router implementation for WebSockets.

## Principles
1. **Separation of Concerns**: Controllers (Routes) handle HTTP, Validation, and Auth. Services handle business logic.
2. **Simplicity over Algorithmic Complexity**: We prioritize readable, maintainable, deterministic solutions over highly complex algorithms like Yjs/OT.
3. **Hybrid Next.js Architecture**: 
   - REST endpoints live in `app/api/` (Edge/Serverless).
   - Socket.io is attached via `pages/api/socket.ts` to tap into `res.socket.server`. This prevents needing a custom Node server (`server.ts`) which would break native Vercel deployment conventions.

## Synchronization (Local-First)
- Uses a **deterministic Last-Write-Wins (LWW)** strategy based on `timestamp`.
- Push endpoint (`POST /api/documents/[id]/sync/push`) accepts bulk operations. 
- Replay attack protection is handled naturally through `id` + `documentId` unique constraints on the DB. Duplicates are idempotently ignored.

## Realtime Collaboration
- Socket.io handles fast ephemeral broadcasts (`cursor-update`, `user-joined`) and immediate rebroadcasting of `document-operation` to peers.
- Offline clients rely on the `/sync/pull` HTTP endpoint upon reconnecting to fetch the ledger.
