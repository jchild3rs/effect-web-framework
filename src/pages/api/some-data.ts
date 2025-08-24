import { HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import type { RouteContext } from "../../lib/types";

export const GET = (_context: RouteContext) =>
	Effect.succeed(HttpServerResponse.unsafeJson({ wee: true }));
