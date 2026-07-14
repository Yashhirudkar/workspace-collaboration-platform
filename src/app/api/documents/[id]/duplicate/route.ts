export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { emitToUser } from '@/services/socket.service';

const routeContextSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

const duplicateSchema = z.object({
  copyCollaborators: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest, context: unknown) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);
    const { params } = routeContextSchema.parse(context);

    await checkDocumentRole(req, params.id, [
      DOCUMENT_ROLES.OWNER,
      DOCUMENT_ROLES.EDITOR,
    ]);

    let copyCollaborators = false;
    try {
      const body = await req.json();
      const validated = duplicateSchema.parse(body);
      copyCollaborators = validated.copyCollaborators;
    } catch {
      // Body is optional — use defaults
    }

    const duplicatedDoc = await DocumentService.duplicateDocument(userId, params.id, copyCollaborators);

    // Real-time: new document appears instantly in all user's open tabs
    emitToUser(userId, 'workspace:document-created', { document: duplicatedDoc });

    return successResponse(duplicatedDoc, 'Document duplicated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
