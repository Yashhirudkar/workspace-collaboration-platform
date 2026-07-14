export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { errorResponse } from '@/utils/response';
import DocumentTag from '@/models/DocumentTag';
import { initDatabase } from '@/config/database';

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
    tagId: z.string().uuid('Invalid tag ID'),
  }),
});

/**
 * @swagger
 * /api/documents/{id}/tags/{tagId}:
 *   delete:
 *     summary: Remove a tag from a document
 *     tags: [Tags]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: tagId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tag removed from document.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden – requires OWNER or EDITOR role.
 *       404:
 *         description: Document not found.
 */
export async function DELETE(request: NextRequest, context: unknown) {
  try {
    await initDatabase();
    getUserIdFromRequest(request);

    const { params } = routeContextSchema.parse(context);

    // BOLA fix: only OWNER or EDITOR may remove tags from a document
    await checkDocumentRole(request, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
    ]);

    await DocumentTag.destroy({
      where: {
        documentId: params.id,
        tagId: params.tagId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
