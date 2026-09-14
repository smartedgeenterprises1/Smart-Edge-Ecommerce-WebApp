import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { AppError } from '../lib/errors.js';
import { fail } from '../lib/api-response.js';
import { env } from '../config/env.js';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      (req as Request & { validatedQuery: T }).validatedQuery = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return fail(res, 'Validation failed', 400, 'VALIDATION_ERROR', err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode, err.code, err.details);
  }
  console.error('[error]', err instanceof Error ? err.message : err);
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err instanceof Error ? err.message : 'Error';
  return fail(res, message, 500, 'INTERNAL_ERROR');
}

export function notFoundHandler(_req: Request, res: Response) {
  return fail(res, 'Route not found', 404, 'NOT_FOUND');
}
