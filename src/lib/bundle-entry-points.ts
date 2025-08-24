import { FileSystem } from "@effect/platform";
import { Context, Effect, Layer } from "effect";
import { origin, routeDir } from "./config.ts";

export class RouteEntries extends Context.Tag("RouteEntries")<
	RouteEntries,
	Readonly<Record<string, { path: string; pattern: URLPattern }>>
>() {}

export const makeRouteEntries = Effect.gen(function* () {
	yield* Effect.logDebug("makeRouteEntries()");
	const fs = yield* FileSystem.FileSystem;

	const entries: Record<string, { path: string; pattern: URLPattern }> = {};

	const files = yield* fs.readDirectory(routeDir, { recursive: true });

	for (const routeFile of files.filter((f) => f.includes("."))) {
		const route = `src/${routeFile}`;
		const routeId = route
			.replace("src/", "")
			.replace(".tsx", "")
			.replace(".ts", "");

		const path = route.replace("src/", `./${routeDir}/`);
		entries[routeId] = {
			path,
			pattern: new URLPattern({
				pathname: transformRoutePath(routeId),
				baseURL: origin,
			}),
		};
	}

	yield* Effect.logDebug(`getRouteEntries(${JSON.stringify(entries)})`);

	return entries;
});

export const RouteEntriesLive = Layer.effect(RouteEntries, makeRouteEntries);

export const bundleEntryPoints = Effect.gen(function* () {
	const routeEntries = yield* RouteEntries;

	return {
		"entry-client": {
			path: "./src/entry-client.tsx",
			pattern: new URLPattern({
				pathname: transformRoutePath("entry-client"),
				baseURL: origin,
			}),
		},
		...routeEntries,
	};
});

function transformRoutePath(path: string): string {
	// Replace index routes with empty string or parent path
	let transformedPath = path.replace(/\/index$/, "").replace("index", "");

	// Handle dynamic segments [param] -> :param
	transformedPath = transformedPath.replace(/\[([^\]]+)]/g, ":$1");

	return `/${transformedPath}`;
}
