export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { updateDocumentSchema } from '@/schemas/document.schema';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { emitToUser } from '@/services/socket.service';
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

    // Real-time: broadcast updated document metadata to all user tabs
    emitToUser(userId, 'workspace:document-updated', { documentId: params.id, changes: validatedData });

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
