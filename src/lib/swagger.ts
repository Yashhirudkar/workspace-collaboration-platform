import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Docflow Collaborative Editor API',
      version: '1.0.0',
      description: 'Production-grade enterprise API documentation for the Local-First Collaborative Document Editor.',
      contact: {
        name: 'API Support',
        email: 'support@docflow.io',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your JWT authorization token (received from /api/auth/login) in the Authorization header.',
        },
      },
    },
  },
  apis: [
    './src/lib/swagger.ts', // Parses JSDoc annotations from this file centrally!
  ],
};

export const getApiSpec = () => {
  return swaggerJSDoc(options);
};

// ==========================================
// CENTRALIZED OPENAPI SCHEMAS & DEFINITIONS
// ==========================================

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "6012c1b5-d595-4efa-8336-2ae6345a5b50"
 *         email:
 *           type: string
 *           format: email
 *           example: "yash@example.com"
 *         name:
 *           type: string
 *           example: "Yash Hirudkar"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:00:00.000Z"
 *
 *     SignupRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "yash@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "Password123!"
 *         name:
 *           type: string
 *           example: "Yash Hirudkar"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "yash@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "Password123!"
 *
 *     Document:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - content
 *         - createdBy
 *         - lastEditedBy
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "5de1c686-e11f-4b8f-800b-1d09aca1f2ce"
 *         title:
 *           type: string
 *           example: "Weekly Design Updates"
 *         content:
 *           type: object
 *           example: { "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Draft roadmap..." }] }] }
 *         createdBy:
 *           type: string
 *           format: uuid
 *           example: "6012c1b5-d595-4efa-8336-2ae6345a5b50"
 *         lastEditedBy:
 *           type: string
 *           format: uuid
 *           example: "6012c1b5-d595-4efa-8336-2ae6345a5b50"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:05:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:10:00.000Z"
 *         role:
 *           type: string
 *           enum: [OWNER, EDITOR, VIEWER]
 *           example: "OWNER"
 *
 *     DocumentCollaborator:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - documentId
 *         - role
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "7ac8b002-3c81-42db-bb1e-a4fe2070f81d"
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "6012c1b5-d595-4efa-8336-2ae6345a5b50"
 *         documentId:
 *           type: string
 *           format: uuid
 *           example: "5de1c686-e11f-4b8f-800b-1d09aca1f2ce"
 *         role:
 *           type: string
 *           enum: [OWNER, EDITOR, VIEWER]
 *           example: "EDITOR"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:05:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:05:00.000Z"
 *
 *     Operation:
 *       type: object
 *       required:
 *         - id
 *         - documentId
 *         - userId
 *         - timestamp
 *         - operationType
 *         - payload
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f4db76de-bb0e-436d-8fe0-c9a9d701048b"
 *         documentId:
 *           type: string
 *           format: uuid
 *           example: "5de1c686-e11f-4b8f-800b-1d09aca1f2ce"
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "6012c1b5-d595-4efa-8336-2ae6345a5b50"
 *         timestamp:
 *           type: integer
 *           format: int64
 *           example: 1773489312000
 *         operationType:
 *           type: string
 *           enum: [INSERT, DELETE, UPDATE, RESTORE]
 *           example: "UPDATE"
 *         payload:
 *           type: object
 *           example: { "title": "Updated Title", "content": {} }
 *         status:
 *           type: string
 *           enum: [PENDING, SYNCED, FAILED]
 *           example: "SYNCED"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:11:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:11:00.000Z"
 *
 *     DocumentVersion:
 *       type: object
 *       required:
 *         - id
 *         - documentId
 *         - versionNumber
 *         - snapshot
 *         - createdBy
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "bf82dca9-482a-4a62-9fe1-0c58f001cda3"
 *         documentId:
 *           type: string
 *           format: uuid
 *           example: "5de1c686-e11f-4b8f-800b-1d09aca1f2ce"
 *         versionNumber:
 *           type: integer
 *           example: 1
 *         snapshot:
 *           type: object
 *           example: { "title": "First Draft", "content": {} }
 *         createdBy:
 *           type: string
 *           format: uuid
 *           example: "6012c1b5-d595-4efa-8336-2ae6345a5b50"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:12:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-07-14T07:12:00.000Z"
 *
 *     SuccessResponse:
 *       type: object
 *       required:
 *         - success
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - success
 *         - error
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Unauthorized access: Invalid signature."
 *
 *     ValidationError:
 *       type: object
 *       required:
 *         - success
 *         - errors
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "email"
 *               message:
 *                 type: string
 *                 example: "Invalid email format"
 */

// ==========================================
// ENDPOINT OPERATION JSDOC SPECIFICATIONS
// ==========================================

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verify service health status
 *     description: Returns basic server run confirmation details.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server status operational.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-07-14T07:13:00.000Z"
 *
 * /api/auth/signup:
 *   post:
 *     summary: Create user profile
 *     description: Registers a new user inside PostgreSQL database.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       200:
 *         description: Registration successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation schema failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: User email already registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user credentials
 *     description: Verifies user password and issues a session JWT bearer token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authorization success. Returns Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsIn..."
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials supplied.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/documents:
 *   get:
 *     summary: List accessible documents
 *     description: Returns all documents where the authenticated user is OWNER, EDITOR, or VIEWER.
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of matched files.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *       401:
 *         description: Authorization bearer token missing/invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create new document
 *     description: Creates a document. Authenticated creator is assigned as OWNER.
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Roadmap 2026"
 *               content:
 *                 type: object
 *                 example: {}
 *     responses:
 *       200:
 *         description: Document successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       401:
 *         description: Authorization required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/documents/{id}:
 *   get:
 *     summary: Fetch single document details
 *     description: Returns the title, content, roles, and dates for a specific document.
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique UUID of target document.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loaded document.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       403:
 *         description: Document access unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Document UUID not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Update document contents
 *     description: Saves title or content changes (restricted to OWNER or EDITOR roles).
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Document UUID.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Final Specs"
 *               content:
 *                 type: object
 *                 example: { "type": "doc", "content": [] }
 *     responses:
 *       200:
 *         description: Document saved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       403:
 *         description: Permission denied (e.g. VIEWER role).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete document
 *     description: Deletes the document (restricted to document OWNER role).
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Target document UUID.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Document deleted successfully"
 *       403:
 *         description: Deletion prohibited (non-owner).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/documents/{id}/sync/push:
 *   post:
 *     summary: Push offline operations queue
 *     description: Resolves and applies dynamic editing operations cached while offline to the cloud DB.
 *     tags:
 *       - Sync
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operations
 *             properties:
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - timestamp
 *                     - operationType
 *                     - payload
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "1a8f9024-a744-4cd0-8d59-a5eb7cdb21ba"
 *                     timestamp:
 *                       type: integer
 *                       format: int64
 *                       example: 1773489312000
 *                     operationType:
 *                       type: string
 *                       enum: [UPDATE, RESTORE]
 *                       example: "UPDATE"
 *                     payload:
 *                       type: object
 *                       example: { "title": "Offline Edit", "content": {} }
 *     responses:
 *       200:
 *         description: All operations applied and synced.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     processedCount:
 *                       type: integer
 *                       example: 3
 *       403:
 *         description: Sync permission denied.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/documents/{id}/sync/pull:
 *   get:
 *     summary: Pull operations history log
 *     description: Fetches operations that have occurred since a specific timestamp to bring local models up to date.
 *     tags:
 *       - Sync
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: since
 *         in: query
 *         required: false
 *         description: Retrieve operations updated after this Unix timestamp (in milliseconds).
 *         schema:
 *           type: integer
 *           format: int64
 *           example: 1773489312000
 *     responses:
 *       200:
 *         description: Operations array.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Operation'
 *
 * /api/documents/{id}/versions:
 *   get:
 *     summary: Get version snapshot history
 *     description: Lists all previously captured versions of a document.
 *     tags:
 *       - Versions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Snapshot timeline array.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DocumentVersion'
 *
 *   post:
 *     summary: Create document version snapshot
 *     description: Manually captures current title and editor state as a new version entry.
 *     tags:
 *       - Versions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Version created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DocumentVersion'
 *
 * /api/documents/{id}/versions/{versionId}:
 *   post:
 *     summary: Restore past document version
 *     description: Reverts the current document content and title back to the specified version's snapshot.
 *     tags:
 *       - Versions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: versionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reversion success. Returns creation operation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Operation'
 *       404:
 *         description: Target version UUID not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/documents/favorites:
 *   get:
 *     summary: List favorite documents
 *     description: Returns all documents that the user has favorited.
 *     tags:
 *       - Favorites
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of favorite documents.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized.
 *
 * /api/documents/{id}/favorite:
 *   post:
 *     summary: Add document to favorites
 *     description: Marks the document as a favorite for the authenticated user.
 *     tags:
 *       - Favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document favorited.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Document not found.
 *
 *   delete:
 *     summary: Remove document from favorites
 *     description: Unmarks the document as a favorite.
 *     tags:
 *       - Favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document unfavorited.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *
 * /api/documents/pinned:
 *   get:
 *     summary: List pinned documents
 *     description: Returns all documents that the user has pinned.
 *     tags:
 *       - Pinned
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pinned documents.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized.
 *
 * /api/documents/{id}/pin:
 *   post:
 *     summary: Pin document
 *     description: Marks the document as pinned for the authenticated user.
 *     tags:
 *       - Pinned
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document pinned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Document not found.
 *
 *   delete:
 *     summary: Unpin document
 *     description: Unmarks the document as pinned.
 *     tags:
 *       - Pinned
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document unpinned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – insufficient role.
 *       404:
 *         description: Document not found.
 *
 * /api/documents/recent:
 *   get:
 *     summary: List recently opened documents
 *     description: Returns documents the authenticated user has recently opened, sorted by last opened time descending.
 *     tags:
 *       - Recent
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of recent documents with activity timestamps.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized.
 *
 * /api/documents/{id}/duplicate:
 *   post:
 *     summary: Duplicate a document
 *     description: Creates a transactional copy including all tags. Only OWNER or EDITOR can duplicate. Optionally copies collaborators.
 *     tags:
 *       - Documents
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               copyCollaborators:
 *                 type: boolean
 *                 default: false
 *                 description: If true, copies existing collaborators (excluding the duplicating user).
 *     responses:
 *       200:
 *         description: Duplicated document.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER or EDITOR role.
 *       404:
 *         description: Document not found.
 *
 * /api/documents/trash:
 *   get:
 *     summary: List trashed documents
 *     description: Returns soft-deleted documents owned by the authenticated user.
 *     tags:
 *       - Trash
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of soft-deleted documents.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized.
 *
 * /api/documents/{id}/restore:
 *   post:
 *     summary: Restore a trashed document
 *     description: Un-deletes a soft-deleted document. Only the OWNER can restore.
 *     tags:
 *       - Trash
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document restored.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER role.
 *       404:
 *         description: Document not found.
 *
 * /api/documents/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a document
 *     description: Hard-deletes a document and all associated data. Only the OWNER can invoke this. This action is irreversible.
 *     tags:
 *       - Trash
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document permanently deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER role.
 *       404:
 *         description: Document not found.
 *
 * /api/tags:
 *   get:
 *     summary: List all tags
 *     description: Returns all available tags, sorted alphabetically.
 *     tags:
 *       - Tags
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *       401:
 *         description: Unauthorized.
 *   post:
 *     summary: Create a tag
 *     description: Creates a new global tag (case-insensitive, normalised to lowercase).
 *     tags:
 *       - Tags
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: backend
 *     responses:
 *       200:
 *         description: Tag created or found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *
 * /api/documents/{id}/tags:
 *   post:
 *     summary: Add a tag to a document
 *     description: Attaches an existing tag to a document. Requires OWNER or EDITOR role.
 *     tags:
 *       - Tags
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tagId]
 *             properties:
 *               tagId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Tag added.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER or EDITOR role.
 *       404:
 *         description: Document not found.
 *
 * /api/documents/{id}/tags/{tagId}:
 *   delete:
 *     summary: Remove a tag from a document
 *     description: Detaches a tag from a document. Requires OWNER or EDITOR role.
 *     tags:
 *       - Tags
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: tagId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tag removed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER or EDITOR role.
 *       404:
 *         description: Document not found.
 *
 * /api/documents/{id}/export/{format}:
 *   get:
 *     summary: Export a document
 *     description: |
 *       Exports the document content as a downloadable file.
 *       Supported formats: `html`, `markdown` (alias `md`), `pdf`.
 *       PDF is generated server-side as a valid PDF/1.4 binary.
 *       Requires at least VIEWER access.
 *     tags:
 *       - Export
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: format
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [html, markdown, md, pdf]
 *         example: pdf
 *     responses:
 *       200:
 *         description: File download.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/html:
 *             schema:
 *               type: string
 *           text/markdown:
 *             schema:
 *               type: string
 *       400:
 *         description: Unsupported export format.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – insufficient role.
 *       404:
 *         description: Document not found.
 *
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: backend
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
