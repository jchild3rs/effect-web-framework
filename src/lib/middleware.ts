import { HttpMiddleware, HttpServerRequest } from "@effect/platform";
import { Context, Effect, Layer, Option } from "effect";
import { matchRoute } from "../lib/bundle-entry-points.ts";
import { Locals } from "../lib/locals.ts";
import { RouteContext } from "../lib/route-context.ts";
import { Uuid } from "../lib/uuid.ts";

export class Middleware extends Context.Tag("Middleware")<
	Middleware,
	Option.Option<HttpMiddleware.HttpMiddleware>
>() {}

export const MiddlewareLive = Layer.effect(
	Middleware,
	Effect.tryPromise({
		try: () =>
			import("../middleware.ts").then((mod) => Option.some(mod.middleware)),
		catch: () => Option.none(),
	}),
);

export const appMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		const middleware = yield* Middleware;
		const request = yield* HttpServerRequest.HttpServerRequest;
		const locals = yield* Locals;
		const uuid = yield* Uuid;

		locals.requestId = yield* uuid.generate;

		const matchedRoute = yield* matchRoute(request.originalUrl);
		if (matchedRoute._tag === "Some" && middleware._tag === "Some") {
			return yield* middleware.value(app) as typeof app;
		}

		return yield* app;
	}).pipe(
		// By providing the empty state here, we basically
		// get CLS (Continuation Local Storage) for free.
		Effect.provideService(Locals, {}),
		Effect.provideService(RouteContext, {
			queryParams: new URLSearchParams(),
			pathParams: {},
			requestId: "",
			routeId: "",
			routeType: "page",
		}),
	),
);
