export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  isOperational: boolean;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function assertFound<T>(value: T | null | undefined, message = 'Not found'): asserts value is T {
  if (value == null) throw new AppError(message, 404, 'NOT_FOUND');
}
