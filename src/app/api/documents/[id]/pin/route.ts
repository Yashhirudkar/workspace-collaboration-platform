export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { errorResponse } from '@/utils/response';
import { z } from 'zod';
import Document from '@/models/Document';
import PinnedDocument from '@/models/PinnedDocument';
import { initDatabase } from '@/config/database';

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

/**
 * @swagger
 * /api/documents/{id}/pin:
 *   post:
 *     summary: Pin a document
 *     tags: [Pinned]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document pinned.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – insufficient role.
 *       404:
 *         description: Document not found.
 *   delete:
 *     summary: Unpin a document
 *     tags: [Pinned]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document unpinned.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – insufficient role.
 *       404:
 *         description: Document not found.
 */
export async function POST(request: NextRequest, context: unknown) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(request);
    const { params } = routeContextSchema.parse(context);

    // BOLA fix: verify the user has access to this document
    await checkDocumentRole(request, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
      DOCUMENT_ROLES.VIEWER,
    ]);

    // Verify document is not soft-deleted
    const document = await Document.findOne({
      where: { id: params.id, deletedAt: null },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await PinnedDocument.findOrCreate({
      where: { userId, documentId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: unknown) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(request);
    const { params } = routeContextSchema.parse(context);

    // BOLA fix: verify the user has access to this document
    await checkDocumentRole(request, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
      DOCUMENT_ROLES.VIEWER,
    ]);

    await PinnedDocument.destroy({
      where: { userId, documentId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
