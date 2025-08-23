import("urlpattern-polyfill");

import { createServer } from "node:http";
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
import { Effect, Layer } from "effect";
import type { ManifestChunk } from "vite";
import { matchRoute, RouteEntriesLive } from "./bundle-entry-points.ts";
import { isProduction, port } from "./config.ts";
import { html } from "./html.ts";
import { BuiltStaticAssets, BuiltStaticAssetsLive } from "./static-assets.ts";
import type { RouteContext, RouteModule } from "./types.ts";
import {
	ViteDevServer,
	ViteDevServerLive,
	viteDevServerMiddleware,
} from "./vite-dev-server.ts";

const viteStaticAssetsMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		if (isProduction) {
			const request = yield* HttpServerRequest.HttpServerRequest;

			const assets = yield* BuiltStaticAssets;

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

const viteRouteHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = request.originalUrl;

	let template = "<!--app-head--> <!--app-body-->";
	let handleRoute: typeof import("../entry-server.tsx").handleRoute;
	const matchedRoute = yield* matchRoute(url);
	let routeEntry: ManifestChunk;

	let routeModule: RouteModule | null = null;
	if (!isProduction) {
		template = html(!isProduction);

		const viteDevServer = yield* ViteDevServer;

		if (matchedRoute) {
			routeModule = yield* Effect.tryPromise(
				() =>
					viteDevServer.ssrLoadModule(
						`/${matchedRoute.entry}`,
					) as Promise<RouteModule>,
			);
		}

		template = yield* Effect.tryPromise(() =>
			viteDevServer.transformIndexHtml(url, template),
		);

		const renderModule = yield* Effect.tryPromise(() =>
			viteDevServer.ssrLoadModule("/src/entry-server.tsx"),
		);
		handleRoute = renderModule.handleRoute;
	} else {
		const manifest = yield* Effect.tryPromise(() =>
			import("../../dist/client/.vite/manifest.json", {
				with: { type: "json" },
			}).then((mod) => mod.default),
		);
		const serverManifest = yield* Effect.tryPromise(() =>
			import("../../dist/server/.vite/manifest.json", {
				with: { type: "json" },
			}).then((mod) => mod.default),
		);

		if (matchedRoute) {
			const entryKey = matchedRoute.entry.replace(
				"./",
				"",
			) as keyof typeof manifest;
			routeEntry = serverManifest[entryKey];

			const serverRouteEntry =
				serverManifest[entryKey as keyof typeof serverManifest];

			if (routeEntry) {
				routeModule = yield* Effect.tryPromise(
					() => import(`../../dist/server/${serverRouteEntry.file}`),
				);
				template = html(!isProduction, manifest, manifest[entryKey]);
			}
		} else {
			template = html(!isProduction, manifest);
		}

		const serverEntry = yield* Effect.tryPromise(
			//@ts-expect-error
			() => import("../../dist/server/entry-server.js"),
		);

		handleRoute =
			serverEntry.handleRoute as typeof import("../entry-server.tsx").handleRoute;
	}

	if (!routeModule) {
		return HttpServerResponse.text("Not found", { status: 404 });
	}
	const searchParams = new URLSearchParams();
	for (const keyVal of request.url.split("?")[1]?.split("&") ?? []) {
		const [key, value] = keyVal.split("=");
		searchParams.append(key, value);
	}

	let params: Record<string, string | undefined> = {};

	if (matchedRoute) {
		// if (routeModule?.paramSchema) {
		// 	params = yield* Schema.validate(routeModule.paramSchema)(
		// 		matchedRoute.result.pathname.groups,
		// 	).pipe(
		// 		Effect.catchAll(() =>
		// 			Effect.succeed(matchedRoute.result.pathname.groups),
		// 		),
		// 	);
		// 	console.log({ params });
		// } else {
		params = matchedRoute.result.pathname.groups;
		// }
	}

	const context: RouteContext = {
		params,
		routeId: "todo",
		routeType: request.url.startsWith("/api") ? "data" : "page",
		searchParams,
	};

	return yield* handleRoute(context, template, routeModule);
});

const SuppliedMiddleware = Effect.tryPromise({
	try: () => import("../middleware.ts").then((mod) => mod?.middleware),
	catch: () => null,
}).pipe(Effect.withSpan("load-app-middleware"));

const appMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		const suppliedMiddleware = yield* SuppliedMiddleware;

		if (suppliedMiddleware) {
			return yield* suppliedMiddleware(app);
		}

		return yield* app;
	}).pipe(Effect.withSpan("app-middleware")),
);

const router = HttpRouter.empty.pipe(
	HttpRouter.all("*", viteRouteHandler),
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

const AppLive = Layer.mergeAll(
	ServerLive,
	BuiltStaticAssetsLive,
	ViteDevServerLive,
	RouteEntriesLive,
);

NodeRuntime.runMain(
	Layer.launch(Layer.provide(app, AppLive)).pipe(
		Effect.provide(NodeContext.layer),
	),
);
