export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/middleware/auth';
import { errorResponse } from '@/utils/response';
import Document from '@/models/Document';
import UserDocumentActivity from '@/models/UserDocumentActivity';

import { initDatabase } from '@/config/database';

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const userId = getUserIdFromRequest(request);

    const recentDocs = await Document.findAll({
      where: { deletedAt: null },
      include: [
        {
          model: UserDocumentActivity,
          as: 'activities',
          required: true,
          where: { userId },
          attributes: ['lastOpenedAt', 'lastEditedAt'],
        }
      ],
      order: [[{ model: UserDocumentActivity, as: 'activities' }, 'lastOpenedAt', 'DESC']],
      limit: 20, // Optional: limit recent docs
    });

    return NextResponse.json(recentDocs);
  } catch (error) {
    return errorResponse(error);
  }
}
