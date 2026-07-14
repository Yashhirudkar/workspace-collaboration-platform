export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/middleware/auth';
import { errorResponse } from '@/utils/response';
import Document from '@/models/Document';
import User from '@/models/User';

import { initDatabase } from '@/config/database';

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(request);

    const pinnedDocs = await Document.findAll({
      where: { deletedAt: null },
      include: [
        {
          model: User,
          as: 'pinnedBy',
          where: { id: userId },
          attributes: [],
        }
      ],
      order: [['updatedAt', 'DESC']], // Could also sort by PinnedDocument.createdAt if required
    });

    return NextResponse.json(pinnedDocs);
  } catch (error) {
    return errorResponse(error);
  }
}
