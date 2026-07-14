export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromRequest } from '@/middleware/auth';
import { errorResponse } from '@/utils/response';
import Tag from '@/models/Tag';
import { initDatabase } from '@/config/database';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    getUserIdFromRequest(request);

    const tags = await Tag.findAll({
      order: [['name', 'ASC']],
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    getUserIdFromRequest(request);

    const body = await request.json();
    const { name } = createTagSchema.parse(body);

    const sanitizedName = name.trim().toLowerCase();

    const [tag] = await Tag.findOrCreate({
      where: { name: sanitizedName },
      defaults: { name: sanitizedName },
    });

    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    return errorResponse(error);
  }
}
