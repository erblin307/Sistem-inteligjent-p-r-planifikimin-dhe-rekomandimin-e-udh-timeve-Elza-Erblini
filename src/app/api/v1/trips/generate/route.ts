import { validateTripBrief } from "@/contracts/trip-brief";
import { createTrip, UnsupportedDestinationError } from "@/server/modules/trips/create-trip";

const MAX_BODY_BYTES = 64 * 1024;

function problem(
  status: number,
  code: string,
  detail: string,
  errors?: { path: string; message: string }[],
) {
  return Response.json(
    {
      type: "about:blank",
      title: status === 422 ? "Trip brief could not be accepted" : "Trip could not be created",
      status,
      detail,
      code,
      ...(errors ? { errors } : {}),
    },
    { status, headers: { "content-type": "application/problem+json" } },
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return problem(413, "REQUEST_TOO_LARGE", "The trip brief is too large.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(400, "INVALID_JSON", "The request body must be valid JSON.");
  }

  const result = validateTripBrief(body);
  if (!result.success) {
    return problem(
      422,
      "BRIEF_INVALID",
      "Review the highlighted trip details and try again.",
      Object.entries(result.errors).map(([path, message]) => ({ path, message })),
    );
  }

  try {
    const trip = createTrip(result.data);
    return Response.json({ data: trip }, { status: 201 });
  } catch (error) {
    if (error instanceof UnsupportedDestinationError) {
      return problem(422, "DESTINATION_NOT_SUPPORTED", error.message, [
        { path: "destination", message: error.message },
      ]);
    }
    return problem(500, "TRIP_CREATION_FAILED", "We couldn't create your trip right now.");
  }
}
