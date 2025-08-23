import { HttpMiddleware } from "@effect/platform";
import { Context, Effect, Layer, Option } from "effect";

export class Middleware extends Context.Tag("Middleware")<
	Middleware,
	Option.Option<HttpMiddleware.HttpMiddleware>
>() {}

export const MiddlewareLive = Layer.effect(
	Middleware,
	Effect.tryPromise({
		try: () =>
			import("../middleware.ts").then((mod) =>
				mod ? Option.some(mod.middleware) : Option.none(),
			),
		catch: () => Option.none(),
	}),
);

export const appMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		const middleware = yield* Middleware;

		if (middleware._tag === "Some") {
			return yield* middleware.value(app) as typeof app;
		}

		return yield* app;
	}),
);
