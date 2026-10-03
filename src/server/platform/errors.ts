/**
 * Domain errors. Services throw these; the HTTP layer maps them to
 * RFC 9457 problem responses (src/server/platform/http.ts). Messages are
 * written for the person using the product.
 */

export type FieldIssue = { path: string; message: string };

export abstract class DomainError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;
}

export class ValidationError extends DomainError {
  readonly status = 422;
  readonly code = "VALIDATION_FAILED";
  constructor(
    readonly issues: FieldIssue[],
    message = "Some fields need attention.",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class BadRequestError extends DomainError {
  readonly status = 400;
  readonly code = "BAD_REQUEST";
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends DomainError {
  readonly status = 401;
  readonly code = "UNAUTHENTICATED";
  constructor(message = "Sign in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = "FORBIDDEN";
  constructor(message = "This request is not allowed.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Also used for resources owned by someone else, so their existence is not revealed. */
export class NotFoundError extends DomainError {
  readonly status = 404;
  readonly code: string;
  constructor(resource: string, message = `${resource} not found.`) {
    super(message);
    this.name = "NotFoundError";
    this.code = `${resource.toUpperCase().replace(/\W+/g, "_")}_NOT_FOUND`;
  }
}

export class PayloadTooLargeError extends DomainError {
  readonly status = 413;
  readonly code = "PAYLOAD_TOO_LARGE";
  constructor(limitBytes: number) {
    super(`Request body is larger than ${Math.round(limitBytes / 1024)} KB.`);
    this.name = "PayloadTooLargeError";
  }
}
