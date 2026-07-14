export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { SyncService } from '@/services/sync.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { ValidationError } from '@/utils/errors';
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid document ID format');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);

    const userId = getUserIdFromRequest(req);
    // Even viewers can pull operations to stay synced
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR, DOCUMENT_ROLES.VIEWER]);

    const url = new URL(req.url);
    const sinceParam = url.searchParams.get('since');
    const sinceTimestamp = sinceParam ? parseInt(sinceParam, 10) : 0;

    if (isNaN(sinceTimestamp)) {
      return errorResponse(new ValidationError('Invalid since parameter'));
    }

    const operations = await SyncService.pullOperations(params.id, sinceTimestamp);

    return successResponse({ operations }, 'Operations pulled successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
