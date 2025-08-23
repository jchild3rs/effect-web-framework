import("urlpattern-polyfill");

import { createServer } from "node:http";
import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform";
import {
	NodeContext,
	NodeHttpServer,
	NodeRuntime,
} from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { RouteEntriesLive } from "./bundle-entry-points.ts";
import { port } from "./config.ts";
import { ManifestLive } from "./manifest.ts";
import { appMiddleware, MiddlewareLive } from "./middleware.ts";
import { routeHandler } from "./route-handler.ts";
import { BuiltStaticAssetsLive } from "./static-assets.ts";
import { NodeSdkLive } from "./tracing.ts";
import { UuidLive } from "./uuid.ts";
import {
	ViteDevServerLive,
	viteDevServerMiddleware,
	viteStaticAssetsMiddleware,
} from "./vite-dev-server.ts";

const router = HttpRouter.empty.pipe(
	HttpRouter.get("/healthz", HttpServerResponse.text("OK")),
	HttpRouter.all("*", routeHandler),
	HttpRouter.use(viteDevServerMiddleware),
	HttpRouter.use(viteStaticAssetsMiddleware),
	HttpRouter.use(appMiddleware),
);

const server = router.pipe(
	Effect.catchAllCause((error) =>
		Effect.gen(function* () {
			yield* Effect.logError(error);

			// TODO: maybe static 500.html file (that goes through vite)
			return yield* HttpServerResponse.text("Internal Server Error", {
				status: 500,
			});
		}),
	),
	HttpServer.serve(),
	HttpServer.withLogAddress,
);

const ServerLive = Layer.mergeAll(
	BuiltStaticAssetsLive,
	ViteDevServerLive,
	RouteEntriesLive,
	MiddlewareLive,
	UuidLive,
	ManifestLive,
	NodeHttpServer.layer(() => createServer(), { port }),
);

NodeRuntime.runMain(
	Layer.launch(
		Layer.provide(server, ServerLive).pipe(
			Layer.provide(NodeContext.layer),
			Layer.provide(NodeSdkLive),
		),
	),
);
