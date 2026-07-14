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
import { emitToUser } from '@/services/socket.service';

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
      DOCUMENT_ROLES.VIEWER,
    ]);

    const document = await Document.findOne({
      where: { id: params.id, deletedAt: null },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await PinnedDocument.findOrCreate({
      where: { userId, documentId: params.id },
    });

    // Real-time: pin state change propagates to all user tabs instantly
    emitToUser(userId, 'workspace:document-pinned', { documentId: params.id, isPinned: true });

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

    await checkDocumentRole(request, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
      DOCUMENT_ROLES.VIEWER,
    ]);

    await PinnedDocument.destroy({
      where: { userId, documentId: params.id },
    });

    // Real-time: unpin propagates to all user tabs
    emitToUser(userId, 'workspace:document-pinned', { documentId: params.id, isPinned: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
