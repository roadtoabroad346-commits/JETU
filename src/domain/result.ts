export const errorStatus = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PROVIDER_NOT_CONFIGURED: 503,
  PROVIDER_TIMEOUT: 504,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof errorStatus;
export type Result<T> =
  | { data: T; requestId: string; error?: never }
  | {
      error: {
        code: ErrorCode;
        message: string;
        requestId: string;
        fieldErrors?: Record<string, string[]>;
      };
      data?: never;
    };
