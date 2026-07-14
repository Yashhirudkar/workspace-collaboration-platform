export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

const duplicateSchema = z.object({
  copyCollaborators: z.boolean().optional().default(false),
});

/**
 * @swagger
 * /api/documents/{id}/duplicate:
 *   post:
 *     summary: Duplicate a document
 *     description: Creates a transactional copy of the document. Only OWNER or EDITOR may duplicate. Tags are also copied. Pass copyCollaborators=true to inherit existing collaborators (excluding yourself).
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               copyCollaborators:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Duplicated document returned.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER or EDITOR role.
 *       404:
 *         description: Document not found.
 */
export async function POST(req: NextRequest, context: unknown) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);

    const { params } = routeContextSchema.parse(context);

    // BOLA fix: only OWNER or EDITOR may duplicate
    await checkDocumentRole(req, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
    ]);

    let copyCollaborators = false;
    try {
      const body = await req.json();
      const validated = duplicateSchema.parse(body);
      copyCollaborators = validated.copyCollaborators;
    } catch {
      // Body is optional — use defaults
    }

    const duplicatedDoc = await DocumentService.duplicateDocument(userId, params.id, copyCollaborators);
    return successResponse(duplicatedDoc, 'Document duplicated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
