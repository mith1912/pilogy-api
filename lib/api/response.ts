import { createHash } from "node:crypto";
import type { ApiResponse } from "@/lib/types/api";
import { ApiError } from "./errors";

export const API_SECURITY_HEADERS = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } as const;

export function success<T>(data: T): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, {
    headers: { ...API_SECURITY_HEADERS, "Cache-Control": "no-store" },
  });
}

export function failure(error: unknown): Response {
  const safe = error instanceof ApiError
    ? error
    : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  const retryAfter = safe.retryAfterSeconds;
  return Response.json({
    success: false,
    error: {
      code: safe.code,
      message: safe.message,
      details: safe.details ?? [],
    },
  } satisfies ApiResponse<never>, {
    status: safe.status,
    headers: { ...API_SECURITY_HEADERS, "Cache-Control": "no-store",
      ...(safe.status === 429 ? { "Retry-After": String(Number.isSafeInteger(retryAfter) && retryAfter! > 0 && retryAfter! <= 86400 ? retryAfter : 60) } : {}),
    },
  });
}

export type PublicRepresentation = Readonly<{ body: string; etag: string }>;

// Only call with static public content, never calculation input/results.
export function preparePublicContent<T>(data: T): PublicRepresentation {
  const body = JSON.stringify({ success: true, data } satisfies ApiResponse<T>);
  return Object.freeze({ body, etag: `W/"${createHash("sha256").update(body).digest("hex")}"` });
}

// Public URLs are not version-pinned: revalidate rather than mark them immutable.
export function preparedPublicContent(request: Request, representation: PublicRepresentation): Response {
  const { body, etag } = representation;
  const headers = { ...API_SECURITY_HEADERS, "Cache-Control": "public, max-age=0, must-revalidate", ETag: etag };
  const matches = request.headers.get("if-none-match")?.split(",").some((tag) => {
    const normalized = tag.trim().replace(/^W\//, "");
    return normalized === "*" || normalized === etag.replace(/^W\//, "");
  });
  return matches ? new Response(null, { status: 304, headers })
    : new Response(body, { headers: { ...headers, "Content-Type": "application/json" } });
}
export function publicContent<T>(request: Request, data: T): Response {
  return preparedPublicContent(request, preparePublicContent(data));
}
