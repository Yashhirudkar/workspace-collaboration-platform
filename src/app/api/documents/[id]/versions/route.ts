export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { VersionService } from '@/services/version.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { getUserIdFromRequest } from '@/middleware/auth';
import { checkDocumentRole } from '@/middleware/roles';
import { DOCUMENT_ROLES } from '@/constants/roles';
import { z } from 'zod';
import { HTTP_STATUS } from '@/constants/statusCodes';

const uuidSchema = z.string().uuid('Invalid document ID format');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);

    const userId = getUserIdFromRequest(req);
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR, DOCUMENT_ROLES.VIEWER]);

    const versions = await VersionService.listVersions(params.id);
    return successResponse(versions, 'Versions retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDatabase();
    uuidSchema.parse(params.id);

    const userId = getUserIdFromRequest(req);
    // Only editors and owners can snapshot
    await checkDocumentRole(req, params.id, [DOCUMENT_ROLES.OWNER, DOCUMENT_ROLES.EDITOR]);

    const version = await VersionService.createSnapshot(userId, params.id);
    return successResponse(version, 'Version created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return errorResponse(error);
  }
}
