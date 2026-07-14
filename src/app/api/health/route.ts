import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/utils/response';
import { sequelize, initDatabase } from '@/config/database';

export async function GET() {
  try {
    await initDatabase();
    await sequelize.authenticate();
    return successResponse({ status: 'ok', db: 'connected' }, 'Health check passed');
  } catch (error) {
    return errorResponse(error);
  }
}
