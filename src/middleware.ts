import { HttpMiddleware, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";

export const middleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		const request = yield* HttpServerRequest.HttpServerRequest;

		yield* Effect.logDebug(`middleware -> ${request.url}`);

		return yield* app;
	}),
);
