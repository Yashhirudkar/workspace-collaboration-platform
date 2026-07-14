import { NextRequest } from 'next/server';
import { loginSchema } from '@/schemas/user.schema';
import { AuthService } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/utils/response';
import { initDatabase } from '@/config/database';
import { AppError } from '@/utils/errors';
import { HTTP_STATUS } from '@/constants/statusCodes';

// -------------------------------------------------------
// Simple in-memory rate limiter (no Redis needed for assignment)
// Tracks failed login attempts per IP. Resets on success.
// -------------------------------------------------------
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
}

function checkRateLimit(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry) {
    // Reset window if it's expired
    if (now - entry.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(ip);
      return;
    }
    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000);
      throw new AppError(`Too many failed login attempts. Try again in ${retryAfterSec}s.`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }
  }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now - entry.firstAttempt <= WINDOW_MS) {
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    await initDatabase();
    
    checkRateLimit(ip);
    
    const body = await req.json();
    const validatedData = loginSchema.parse(body);
    
    const result = await AuthService.login(validatedData);
    
    // Clear failed attempts on successful login
    loginAttempts.delete(ip);
    
    return successResponse(result, 'Login successful');
  } catch (error) {
    // Only record failed attempt for auth failures, not validation errors
    if (error instanceof AppError && error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
      recordFailedAttempt(ip);
    }
    return errorResponse(error);
  }
}
