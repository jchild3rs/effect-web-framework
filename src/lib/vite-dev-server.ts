import {
	HttpMiddleware,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { NodeHttpServerRequest } from "@effect/platform-node";
import { Context, Effect, Layer } from "effect";
import { base, isProduction } from "./config.ts";
import { StaticAssets } from "./static-assets.ts";

export class ViteDevServer extends Context.Tag("ViteDevServer")<
	ViteDevServer,
	import("vite").ViteDevServer
>() {}

export const ViteDevServerLive = Layer.effect(
	ViteDevServer,
	Effect.gen(function* () {
		if (isProduction) {
			return null as never;
		}

		const { createServer: createViteDevServer } = yield* Effect.tryPromise(
			() => import("vite"),
		);

		const devServer = yield* Effect.tryPromise(() =>
			createViteDevServer({
				server: { middlewareMode: true },
				appType: "custom",
				base,
			}),
		);

		yield* Effect.log("Vite dev server started");

		return devServer;
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

export const viteStaticAssetsMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		if (isProduction) {
			const request = yield* HttpServerRequest.HttpServerRequest;

			const assets = yield* StaticAssets;

			const matchedPath = assets.find((asset) =>
				`/${asset}`.endsWith(request.url),
			);

			if (matchedPath) {
				return yield* HttpServerResponse.file(`./dist/client/${matchedPath}`);
			}
		}

		return yield* app;
	}),
);
