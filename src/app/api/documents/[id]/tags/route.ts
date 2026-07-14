export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { errorResponse } from '@/utils/response';
import Document from '@/models/Document';
import DocumentTag from '@/models/DocumentTag';
import Tag from '@/models/Tag';
import { initDatabase } from '@/config/database';
import { emitToUser } from '@/services/socket.service';

const addTagSchema = z.object({
  tagId: z.string().uuid('Invalid tag ID'),
});

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

export async function POST(request: NextRequest, context: unknown) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(request);

    const { params } = routeContextSchema.parse(context);

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

    // Fetch tag data to include in broadcast
    const tag = await Tag.findByPk(tagId);

    // Real-time: tag addition propagates to all tabs
    emitToUser(userId, 'workspace:document-tag-added', {
      documentId: params.id,
      tag: tag ? { id: tag.id, name: (tag as any).name, createdAt: (tag as any).createdAt, updatedAt: (tag as any).updatedAt } : { id: tagId, name: '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
