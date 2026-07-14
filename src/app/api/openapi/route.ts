import { NextResponse } from 'next/server';
import { getApiSpec } from '@/lib/swagger';

export async function GET() {
  try {
    const spec = getApiSpec();
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
