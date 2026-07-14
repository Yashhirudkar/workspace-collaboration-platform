# Database Schema

## Users
- `id` (UUID, PK)
- `email`, `passwordHash`, `name`

## Documents
- `id` (UUID, PK)
- `title`, `content` (JSONB), `createdBy`, `lastEditedBy`

## DocumentCollaborators (Roles)
- `id` (UUID, PK), `userId`, `documentId`
- `role` (ENUM: 'OWNER', 'EDITOR', 'VIEWER')

## Operations (Sync Ledger)
- `id` (UUID, PK) -> Matches the client operationId to prevent replays.
- `documentId` (UUID, FK -> Documents.id)
- `userId` (UUID, FK -> Users.id)
- `timestamp` (BigInt) -> Crucial for Last-Write-Wins merge strategy.
- `operationType` (ENUM: 'INSERT', 'DELETE', 'UPDATE', 'RESTORE')
- `payload` (JSONB)
- `status` (ENUM: 'PENDING', 'SYNCED', 'FAILED')
- *Constraint*: `id` and `documentId` are unique to enforce idempotency.

## DocumentVersions (History)
- `id` (UUID, PK)
- `documentId` (UUID, FK -> Documents.id)
- `versionNumber` (Integer) -> Sequential tracking.
- `snapshot` (JSONB) -> Complete snapshot at the time of versioning.
- `createdBy` (UUID, FK -> Users.id)

### Associations
- All parent deletions (User/Document) cascade to Collaborators, Operations, and Versions.
