export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/middleware/auth';
import { DocumentService } from '@/services/document.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(req);
    
    const trashDocs = await DocumentService.getTrashForUser(userId);
    return successResponse(trashDocs, 'Trash retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}
