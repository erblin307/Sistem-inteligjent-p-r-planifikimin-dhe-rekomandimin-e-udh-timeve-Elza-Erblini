import "server-only";

import type { z } from "zod";

import {
  BadRequestError,
  DomainError,
  ForbiddenError,
  PayloadTooLargeError,
  ValidationError,
  type FieldIssue,
} from "./errors";

/**
 * Thin HTTP layer for Route Handlers: request ids, origin checks on
 * mutations, body and query parsing with Zod, and one error format
 * (RFC 9457 application/problem+json). Handlers stay a few lines long.
 */

const MAX_BODY_BYTES = 64 * 1024;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type Problem = {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  requestId: string;
  errors?: FieldIssue[];
};

type Handler<C> = (request: Request, context: C, meta: { requestId: string }) => Promise<Response>;

export function route<C = unknown>(handler: Handler<C>) {
  return async (request: Request, context: C): Promise<Response> => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    try {
      if (!SAFE_METHODS.has(request.method)) assertSameOrigin(request);
      const response = await handler(request, context, { requestId });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      return problemResponse(error, requestId);
    }
  };
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...init.headers },
  });
}

export async function parseJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    throw new BadRequestError("Send the request body as application/json.");
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) throw new PayloadTooLargeError(MAX_BODY_BYTES);

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError(MAX_BODY_BYTES);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new BadRequestError("The request body is not valid JSON.");
  }
  return parseWith(schema, body);
}

/**
 * Query strings become plain objects; keys that repeat (?interest=a&interest=b)
 * become arrays, and comma lists (?interest=a,b) are left for the schema.
 */
export function parseQuery<S extends z.ZodType>(request: Request, schema: S): z.output<S> {
  const params = new URL(request.url).searchParams;
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    raw[key] = values.length > 1 ? values : (values[0] ?? "");
  }
  return parseWith(schema, raw);
}

export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return; // Non-browser clients do not send Origin.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ForbiddenError("Cross-site requests are not allowed.");
  }
  if (!host || originHost !== host) {
    throw new ForbiddenError("Cross-site requests are not allowed.");
  }
}

export function problemResponse(error: unknown, requestId: string): Response {
  const problem = toProblem(error, requestId);
  if (problem.status >= 500) {
    console.error(JSON.stringify({ level: "error", requestId, error: describe(error) }));
  }
  return new Response(JSON.stringify(problem), {
    status: problem.status,
    headers: {
      "content-type": "application/problem+json",
      "cache-control": "no-store",
      "x-request-id": requestId,
    },
  });
}

function toProblem(error: unknown, requestId: string): Problem {
  if (error instanceof DomainError) {
    return {
      type: `urn:itinera:problem:${error.code.toLowerCase()}`,
      title: titleFor(error.status),
      status: error.status,
      detail: error.message,
      code: error.code,
      requestId,
      ...(error instanceof ValidationError ? { errors: error.issues } : {}),
    };
  }
  return {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "Something went wrong on our side. Try again in a moment.",
    code: "INTERNAL_ERROR",
    requestId,
  };
}

function titleFor(status: number) {
  return (
    {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      413: "Payload Too Large",
      422: "Unprocessable Content",
    }[status] ?? "Error"
  );
}

function describe(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
}
