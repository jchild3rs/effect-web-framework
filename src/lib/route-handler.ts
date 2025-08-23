import { HttpServerRequest } from "@effect/platform";
import { Effect, Option } from "effect";
import { matchRoute } from "./bundle-entry-points.ts";
import { isProduction, routeDir, templateHeadToken } from "./config.ts";
import { document } from "./document.ts";
import {
	ProductionClientManifest,
	ProductionServerManifest,
} from "./manifest.ts";
import type { RouteModule } from "./types.ts";
import { Uuid } from "./uuid.ts";
import { ViteDevServer } from "./vite-dev-server.ts";

export const routeHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = request.originalUrl;
	const uuid = yield* Uuid;
	const requestId = yield* uuid.generate;

	let template = `${templateHeadToken} <!--app-body-->`;
	let handleRoute: typeof import("../entry-server.tsx").handleRoute;
	const matchedRoute = yield* matchRoute(url);
	let routeModule = Option.none<RouteModule>();

	if (!isProduction) {
		template = document(!isProduction);

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
		const clientManifest = yield* ProductionClientManifest;
		const serverManifest = yield* ProductionServerManifest;

		if (matchedRoute) {
			const entryKey = matchedRoute.entry.replace(
				"./",
				"",
			) as keyof typeof clientManifest;

			const serverRouteEntry =
				serverManifest[entryKey as keyof typeof serverManifest];

			if (serverRouteEntry) {
				// TODO: consider loading all these up front and referencing (no reason to re-import every time)
				routeModule = Option.some(
					yield* Effect.tryPromise(
						() => import(`../../dist/server/${serverRouteEntry.file}`),
					),
				);

				template = document(
					!isProduction,
					clientManifest,
					clientManifest[entryKey],
				);
			}
		} else {
			template = document(!isProduction, clientManifest);
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
