export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { updateDocumentSchema } from '@/schemas/document.schema';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { emitToUser, getIO } from '@/services/socket.service';
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid document ID format');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);
    const userId = getUserIdFromRequest(req);
    const document = await DocumentService.getDocumentById(userId, params.id);
    return successResponse(document, 'Document retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);
    const userId = getUserIdFromRequest(req);
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR]);
    const body = await req.json();
    const validatedData = updateDocumentSchema.parse(body);
    const document = await DocumentService.updateDocument(userId, params.id, validatedData);

    // The saving device sends its socket.id as x-socket-id header.
    // We include it in the broadcast so the saving tab can skip applying
    // its own save (prevents flicker), while OTHER devices/tabs of the same
    // user DO apply it (enables cross-device sync, e.g. mobile → PC).
    const fromSocketId = req.headers.get('x-socket-id') || undefined;
    const io = getIO();
    const payload = {
      documentId: params.id,
      changes: validatedData,
      fromSocketId,
    };

    // Broadcast to all tabs of this user (cross-device sync)
    emitToUser(userId, 'workspace:document-updated', payload);

    // Also broadcast to the doc room so collaborators (different users)
    // viewing the same document get the update
    if (io) {
      io.to(`doc-${params.id}`).emit('workspace:document-updated', payload);
    }

    return successResponse(document, 'Document updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);
    const userId = getUserIdFromRequest(req);
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER]);
    await DocumentService.deleteDocument(userId, params.id);

    // Real-time: notify all user tabs the document was moved to trash
    emitToUser(userId, 'workspace:document-deleted', { documentId: params.id });

    return successResponse(null, 'Document deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
