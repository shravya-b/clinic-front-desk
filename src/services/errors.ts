export type ApiErrorCode = 'NETWORK' | 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT';

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(message: string, code: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
