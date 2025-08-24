import { HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect, Option, Schema } from "effect";
import { matchRoute } from "./bundle-entry-points.ts";
import { isProduction, routeDir } from "./config.ts";
import { document } from "./document.ts";
import {
	ProductionClientManifest,
	ProductionServerManifest,
} from "./manifest.ts";
import { RouteContext, RouteContextData } from "./route-context.ts";
import type { RouteModule } from "./types.ts";
import { Uuid } from "./uuid.ts";
import { ViteDevServer } from "./vite-dev-server.ts";

export const routeHandler = Effect.gen(function* () {
	const routeContext = yield* RouteContext;
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = request.originalUrl;
	const matchedRoute = yield* matchRoute(url);
	const uuid = yield* Uuid;

	if (Option.isNone(matchedRoute)) {
		return HttpServerResponse.text("Not found", { status: 404 });
	}

	let template = document({ isProduction });
	let routeModule: RouteModule = {};
	let handleRoute: typeof import("../entry-server.tsx").handleRoute;

	if (isProduction) {
		const serverManifest = yield* ProductionServerManifest;
		const clientManifest = yield* ProductionClientManifest;
		const entryKey = matchedRoute.value.entry.replace(
			"./",
			"",
		) as keyof typeof clientManifest;

		const serverRouteEntry =
			serverManifest[entryKey as keyof typeof serverManifest];

		template = document({
			isProduction,
			mainEntry: clientManifest["src/entry-client.tsx"],
			routeEntry: clientManifest[entryKey],
		});

		routeModule = yield* loadModule<RouteModule>(serverRouteEntry.file);
		handleRoute = yield* loadModule<typeof import("../entry-server.tsx")>(
			"entry-server.js",
		).pipe(Effect.map((mod) => mod.handleRoute));
	} else {
		const viteDevServer = yield* ViteDevServer;

		template = yield* Effect.tryPromise(() =>
			viteDevServer.transformIndexHtml(url, template),
		);

		routeModule = yield* loadDevModule<RouteModule>(matchedRoute.value.entry);
		handleRoute = yield* loadDevModule<typeof import("../entry-server.tsx")>(
			"./src/entry-server.tsx",
		).pipe(Effect.map((mod) => mod.handleRoute));
	}

	routeContext.queryParams = new URLSearchParams();
	for (const keyVal of request.url.split("?")[1]?.split("&") ?? []) {
		const [key, value] = keyVal.split("=");
		routeContext.queryParams.append(key, value);
	}

	routeContext.pathParams = matchedRoute
		? matchedRoute.value.result.pathname.groups
		: {};

	routeContext.routeId =
		matchedRoute?.value.entry
			?.replace(`${routeDir}/index.tsx`, "/")
			?.replace(routeDir, "")
			?.replace("./", "")
			?.replace("/index.tsx", "") ?? "unknown";

	routeContext.routeType = request.url.startsWith("/api") ? "data" : "page";

	routeContext.requestId = yield* uuid.generate;

	yield* Schema.validate(RouteContextData)(routeContext);

	return yield* handleRoute(routeContext, template, routeModule);
});

function loadModule<T>(file: string) {
	return Effect.gen(function* () {
		yield* Effect.logDebug(`loadModule(${file})`);
		return yield* Effect.promise(
			() => import(`../../dist/server/${file}`) as Promise<T>,
		);
	});
}

function loadDevModule<T>(file: string) {
	return Effect.gen(function* () {
		yield* Effect.logDebug(`loadDevModule(${file})`);
		const viteDevServer = yield* ViteDevServer;
		return yield* Effect.promise(
			() => viteDevServer.ssrLoadModule(file) as Promise<T>,
		);
	});
}

// function makeRouteContext(matchedRoute: MatchedRoute) {
// 	return Effect.gen(function* () {
// 		const request = yield* HttpServerRequest.HttpServerRequest;
// 		const uuid = yield* Uuid;
// 		const requestId = yield* uuid.generate;
//
// 		const searchParams = new URLSearchParams();
// 		for (const keyVal of request.url.split("?")[1]?.split("&") ?? []) {
// 			const [key, value] = keyVal.split("=");
// 			searchParams.append(key, value);
// 		}
//
// 		const params: Record<string, string | undefined> = matchedRoute
// 			? matchedRoute.result.pathname.groups
// 			: {};
//
// 		const routeId =
// 			matchedRoute?.entry
// 				?.replace(`${routeDir}/index.tsx`, "/")
// 				?.replace(routeDir, "")
// 				?.replace("./", "")
// 				?.replace("/index.tsx", "") ?? "unknown";
//
// 		const routeType = request.url.startsWith("/api") ? "data" : "page";
//
// 		return {
// 			pathParams: params,
// 			requestId,
// 			routeId,
// 			routeType,
// 			queryParams: searchParams,
// 		} satisfies RouteContext;
// 	});
// }
