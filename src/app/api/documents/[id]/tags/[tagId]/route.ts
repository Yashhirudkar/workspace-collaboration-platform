export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { errorResponse } from '@/utils/response';
import DocumentTag from '@/models/DocumentTag';
import { initDatabase } from '@/config/database';
import { emitToUser } from '@/services/socket.service';

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
    tagId: z.string().uuid('Invalid tag ID'),
  }),
});

export async function DELETE(request: NextRequest, context: unknown) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(request);

    const { params } = routeContextSchema.parse(context);

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

    // Real-time: tag removal propagates to all tabs
    emitToUser(userId, 'workspace:document-tag-removed', {
      documentId: params.id,
      tagId: params.tagId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
