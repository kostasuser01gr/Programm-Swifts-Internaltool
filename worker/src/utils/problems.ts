// ── Problem Details Response ──────────────────────────────
// RFC 9457 (Problem Details for HTTP APIs) style error responses.
// Provides consistent, parseable error format across all endpoints.

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Array<{ field: string; message: string }>;
}

export function problemResponse(
  status: number,
  title: string,
  detail?: string,
  errors?: Array<{ field: string; message: string }>,
): Response {
  const body: ProblemDetails = {
    type: `https://dataos.app/problems/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    ...(detail && { detail }),
    ...(errors && { errors }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

// Common problem responses
export const Problems = {
  badRequest: (detail?: string, errors?: Array<{ field: string; message: string }>) =>
    problemResponse(400, 'Bad Request', detail, errors),

  unauthorized: (detail = 'Authentication required') =>
    problemResponse(401, 'Unauthorized', detail),

  forbidden: (detail = 'Insufficient permissions') =>
    problemResponse(403, 'Forbidden', detail),

  notFound: (detail = 'Resource not found') =>
    problemResponse(404, 'Not Found', detail),

  conflict: (detail: string) =>
    problemResponse(409, 'Conflict', detail),

  tooManyRequests: (detail = 'Rate limit exceeded') =>
    problemResponse(429, 'Too Many Requests', detail),

  internal: (detail = 'An unexpected error occurred') =>
    problemResponse(500, 'Internal Server Error', detail),

  serviceUnavailable: (detail = 'Service temporarily unavailable') =>
    problemResponse(503, 'Service Unavailable', detail),
};
