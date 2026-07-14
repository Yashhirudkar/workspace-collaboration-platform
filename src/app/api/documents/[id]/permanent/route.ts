export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/middleware/auth';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { emitToUser } from '@/services/socket.service';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);
    
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER]);

    await DocumentService.permanentDeleteDocument(userId, params.id);

    // Real-time: notify all tabs this document is gone forever
    emitToUser(userId, 'workspace:document-permanently-deleted', { documentId: params.id });

    return successResponse(null, 'Document permanently deleted');
  } catch (error) {
    return errorResponse(error);
  }
}
