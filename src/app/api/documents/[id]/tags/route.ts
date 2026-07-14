export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { errorResponse } from '@/utils/response';
import Document from '@/models/Document';
import DocumentTag from '@/models/DocumentTag';
import { initDatabase } from '@/config/database';

const addTagSchema = z.object({
  tagId: z.string().uuid('Invalid tag ID'),
});

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

/**
 * @swagger
 * /api/documents/{id}/tags:
 *   post:
 *     summary: Add a tag to a document
 *     tags: [Tags]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
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
 *         description: Tag added to document.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER or EDITOR role.
 *       404:
 *         description: Document not found.
 */
export async function POST(request: NextRequest, context: unknown) {
  try {
    await initDatabase();
    getUserIdFromRequest(request);

    const { params } = routeContextSchema.parse(context);

    // BOLA fix: only OWNER or EDITOR may add tags
    await checkDocumentRole(request, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
    ]);

    const body = await request.json();
    const { tagId } = addTagSchema.parse(body);

    const document = await Document.findOne({
      where: { id: params.id, deletedAt: null },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await DocumentTag.findOrCreate({
      where: { documentId: params.id, tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
