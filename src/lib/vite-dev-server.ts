import { HttpMiddleware, HttpServerRequest } from "@effect/platform";
import { NodeHttpServerRequest } from "@effect/platform-node";
import { Context, Effect, Layer } from "effect";
import { base, isProduction } from "./config.ts";

export class ViteDevServer extends Context.Tag("ViteDevServer")<
	ViteDevServer,
	import("vite").ViteDevServer
>() {}

export const ViteDevServerLive = Layer.effect(
	ViteDevServer,
	Effect.gen(function* () {
		const { createServer: createViteDevServer } = yield* Effect.tryPromise(
			() => import("vite"),
		);

		return yield* Effect.tryPromise(() =>
			createViteDevServer({
				server: { middlewareMode: true },
				appType: "custom",
				base,
			}),
		);
	}),
);

export const viteDevServerMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		if (!isProduction) {
			const viteDevServer = yield* ViteDevServer;
			const request = yield* HttpServerRequest.HttpServerRequest;

			yield* Effect.async<void, Error>((resume) => {
				viteDevServer.middlewares.handle(
					NodeHttpServerRequest.toIncomingMessage(request),
					NodeHttpServerRequest.toServerResponse(request),
					(err: Error) => {
						resume(err ? Effect.fail(err) : Effect.void);
					},
				);
			});
		}

		return yield* app;
	}),
);
