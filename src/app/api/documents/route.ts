export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createDocumentSchema } from '@/schemas/document.schema';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { HTTP_STATUS } from '@/constants/statusCodes';
import { emitToUser } from '@/services/socket.service';

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);
    
    const body = await req.json();
    const validatedData = createDocumentSchema.parse(body);
    
    const document = await DocumentService.createDocument(userId, validatedData);
    
    // Real-time: broadcast new document to all tabs of this user
    emitToUser(userId, 'workspace:document-created', { document });
    
    return successResponse(document, 'Document created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);
    
    const documents = await DocumentService.getDocumentsForUser(userId);
    
    return successResponse(documents, 'Documents retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
