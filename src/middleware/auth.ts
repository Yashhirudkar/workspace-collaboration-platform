import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { MESSAGES } from '../constants/messages';

export function getUserIdFromRequest(req: NextRequest): string {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError(MESSAGES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    throw new UnauthorizedError(MESSAGES.UNAUTHORIZED);
  }
}
