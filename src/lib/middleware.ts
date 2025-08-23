import type { HttpMiddleware } from "@effect/platform";
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
