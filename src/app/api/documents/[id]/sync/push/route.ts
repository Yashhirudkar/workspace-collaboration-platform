import { NextRequest } from 'next/server';
import { pushOperationsSchema } from '@/schemas/sync.schema';
import { SyncService } from '@/services/sync.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid document ID format');

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);

    const userId = getUserIdFromRequest(req);
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR]);

    const body = await req.json();
    const validatedData = pushOperationsSchema.parse(body);

    const result = await SyncService.pushOperations(userId, params.id, validatedData);

    return successResponse(result, 'Operations pushed successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
