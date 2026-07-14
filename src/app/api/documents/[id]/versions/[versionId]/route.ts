import { NextRequest } from 'next/server';
import { VersionService } from '@/services/version.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format');

export async function GET(req: NextRequest, { params }: { params: { id: string, versionId: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);
    uuidSchema.parse(params.versionId);

    const userId = getUserIdFromRequest(req);
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR, DOCUMENT_ROLES.VIEWER]);

    const version = await VersionService.getVersion(params.versionId);
    return successResponse(version, 'Version retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string, versionId: string } }) {
  // RESTORE endpoint
  try {
    await initDatabase();
    uuidSchema.parse(params.id);
    uuidSchema.parse(params.versionId);

    const userId = getUserIdFromRequest(req);
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR]);

    const operation = await VersionService.restoreVersion(userId, params.id, params.versionId);
    
    return successResponse(operation, 'Version restored successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
