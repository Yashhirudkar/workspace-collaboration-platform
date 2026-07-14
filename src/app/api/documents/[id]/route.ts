export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { updateDocumentSchema } from '@/schemas/document.schema';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';

import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid document ID format');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);
    
    const userId = getUserIdFromRequest(req);
    
    // Explicit role check is handled implicitly in getDocumentById for basic access, 
    // but checkDocumentRole could be used here to enforce specific roles.
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
    
    // Explicit role check middleware (only OWNER or EDITOR can edit)
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR]);
    
    const body = await req.json();
    const validatedData = updateDocumentSchema.parse(body);
    
    const document = await DocumentService.updateDocument(userId, params.id, validatedData);
    
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
    
    // Only OWNER can delete
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER]);
    
    await DocumentService.deleteDocument(userId, params.id);
    
    return successResponse(null, 'Document deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
