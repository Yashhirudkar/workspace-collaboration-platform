# API Flow

Every request follows a strict pipeline:

1. **Request**: Enters Next.js Route Handler.
2. **Database Init (lazy)**: Verifies/Syncs Sequelize connection (only once per instance).
3. **Auth Check**: Extracts JWT from `Authorization` header. Decodes `userId`.
4. **Validation**: Zod parses `req.json()` against defined schemas.
5. **Role Check (if applicable)**: Hits `DocumentCollaborator` table to verify document permissions (OWNER, EDITOR, VIEWER).
6. **Service**: Executes business logic.
7. **Response**: 
   - All success uses standard wrapper (`{ success: true, data, message }`).
   - All errors caught by centralized `errorResponse` utilizing custom Error classes (e.g. `UnauthorizedError`, `ValidationError`).
