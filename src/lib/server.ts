import("urlpattern-polyfill");

import { createServer } from "node:http";
import { NodeSdk } from "@effect/opentelemetry";
import {
	HttpMiddleware,
	HttpRouter,
	HttpServer,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import {
	NodeContext,
	NodeHttpServer,
	NodeRuntime,
} from "@effect/platform-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Effect, Layer, Option } from "effect";
import type { ManifestChunk } from "vite";
import { matchRoute, RouteEntriesLive } from "./bundle-entry-points.ts";
import { isProduction, port, routeDir } from "./config.ts";
import { html } from "./html.ts";
import {
	ManifestLive,
	ProductionClientManifest,
	ProductionServerManifest,
} from "./manifest.ts";
import { Middleware, MiddlewareLive } from "./middleware.ts";
import { BuiltStaticAssetsLive } from "./static-assets.ts";
import type { RouteModule } from "./types.ts";
import { Uuid, UuidLive } from "./uuid.ts";
import {
	ViteDevServer,
	ViteDevServerLive,
	viteDevServerMiddleware,
	viteStaticAssetsMiddleware,
} from "./vite-dev-server.ts";

const viteRouteHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = request.originalUrl;
	const uuid = yield* Uuid;
	const requestId = yield* uuid.generate;

	let template = "<!--app-head--> <!--app-body-->";
	let handleRoute: typeof import("../entry-server.tsx").handleRoute;
	const matchedRoute = yield* matchRoute(url);
	let routeEntry = Option.none<ManifestChunk>();
	let routeModule = Option.none<RouteModule>();

	if (!isProduction) {
		template = html(!isProduction);

		const viteDevServer = yield* ViteDevServer;

		if (matchedRoute) {
			routeModule = Option.some(
				yield* Effect.tryPromise(
					() =>
						// in dev mode, we want ot always load things fresh
						viteDevServer.ssrLoadModule(
							`/${matchedRoute.entry}`,
						) as Promise<RouteModule>,
				),
			);
		}

		template = yield* Effect.tryPromise(() =>
			// in dev mode, we want ot always load things fresh
			viteDevServer.transformIndexHtml(url, template),
		);

		handleRoute = (yield* Effect.tryPromise(() =>
			viteDevServer.ssrLoadModule("/src/entry-server.tsx"),
		)).handleRoute;
	} else {
		const manifest = yield* ProductionClientManifest;
		const serverManifest = yield* ProductionServerManifest;

		if (matchedRoute) {
			const entryKey = matchedRoute.entry.replace(
				"./",
				"",
			) as keyof typeof manifest;
			routeEntry = Option.some(serverManifest[entryKey]);

			const serverRouteEntry =
				serverManifest[entryKey as keyof typeof serverManifest];

			if (routeEntry) {
				// TODO: consider loading all these up front and referencing (no reason to re-import every time)
				routeModule = yield* Effect.tryPromise(
					() => import(`../../dist/server/${serverRouteEntry.file}`),
				);
				template = html(!isProduction, manifest, manifest[entryKey]);
			}
		} else {
			template = html(!isProduction, manifest);
		}

		const serverEntry = yield* Effect.tryPromise(
			// @ts-expect-error
			() => import("../../dist/server/entry-server.js"),
		);

		handleRoute =
			serverEntry.handleRoute as typeof import("../entry-server.tsx").handleRoute;
	}

	const searchParams = new URLSearchParams();
	for (const keyVal of request.url.split("?")[1]?.split("&") ?? []) {
		const [key, value] = keyVal.split("=");
		searchParams.append(key, value);
	}

	const params: Record<string, string | undefined> = matchedRoute
		? matchedRoute.result.pathname.groups
		: {};

	const routeId =
		matchedRoute?.entry
			?.replace(`${routeDir}/index.tsx`, "/")
			?.replace(routeDir, "")
			?.replace("./", "")
			?.replace("/index.tsx", "") ?? "unknown";

	const routeType = request.url.startsWith("/api") ? "data" : "page";

	return yield* handleRoute(
		{
			pathParams: params,
			requestId,
			routeId,
			routeType,
			queryParams: searchParams,
		},
		template,
		routeModule,
	);
}).pipe(Effect.withSpan("route-handler"));

const appMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		const middleware = yield* Middleware;

		if (middleware._tag === "Some") {
			return yield* middleware.value(app) as typeof app;
		}

		return yield* app;
	}),
);

const router = HttpRouter.empty.pipe(
	HttpRouter.all("*", viteRouteHandler),
	HttpRouter.get("/healthz", HttpServerResponse.text("OK")),
	HttpRouter.use(viteDevServerMiddleware),
	HttpRouter.use(viteStaticAssetsMiddleware),
	HttpRouter.use(appMiddleware),
);

const app = router.pipe(
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

const ServerLive = NodeHttpServer.layer(() => createServer(), { port });

const NodeSdkLive = NodeSdk.layer(() => ({
	resource: { serviceName: "example-app-server" },
	spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}));

const AppLive = Layer.mergeAll(
	ServerLive,
	BuiltStaticAssetsLive,
	ViteDevServerLive,
	RouteEntriesLive,
	MiddlewareLive,
	UuidLive,
	ManifestLive,
	NodeContext.layer,
	NodeSdkLive,
);

NodeRuntime.runMain(
	Layer.launch(
		Layer.provide(app, AppLive).pipe(Layer.provide(NodeContext.layer)),
	),
);
