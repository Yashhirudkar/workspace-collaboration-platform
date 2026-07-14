import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';
import { ZodError } from 'zod';
import { logger } from './logger';

export function successResponse(data: unknown = {}, message: string = MESSAGES.SUCCESS, status: number = HTTP_STATUS.OK) {
  return NextResponse.json({
    success: true,
    message,
    data,
  }, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      message: error.message,
      errors: error.details ? [error.details] : [],
    }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      message: MESSAGES.VALIDATION_ERROR,
      errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({
      success: false,
      message: 'Malformed JSON payload',
      errors: [],
    }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  logger.error('Unhandled Exception', error);
  return NextResponse.json({
    success: false,
    message: MESSAGES.INTERNAL_ERROR,
    errors: [],
  }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
}
