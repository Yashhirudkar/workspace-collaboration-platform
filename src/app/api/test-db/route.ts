import { NextResponse } from 'next/server';
import { initDatabase, sequelize } from '@/config/database';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDatabase();
    
    // Check tables in public schema
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name ASC
    `);
    
    return NextResponse.json({
      success: true,
      tables: tables.map((t: any) => t.table_name)
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
