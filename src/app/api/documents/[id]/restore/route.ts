export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/middleware/auth';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);
    
    // Only OWNER can restore
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER]);

    const restoredDoc = await DocumentService.restoreDocument(userId, params.id);
    return successResponse(restoredDoc, 'Document restored successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
