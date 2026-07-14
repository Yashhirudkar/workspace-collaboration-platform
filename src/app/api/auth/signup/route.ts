import { NextRequest } from 'next/server';
import { signupSchema } from '@/schemas/user.schema';
import { AuthService } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { HTTP_STATUS } from '@/constants/statusCodes';

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    const validatedData = signupSchema.parse(body);
    
    const user = await AuthService.signup(validatedData);
    
    return successResponse(user, 'User created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return errorResponse(error);
  }
}
