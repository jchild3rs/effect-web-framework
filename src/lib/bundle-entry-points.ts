import { FileSystem } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Context, Effect, Layer } from "effect";
import { origin, routeDir } from "./config.ts";

export class RouteEntries extends Context.Tag("RouteEntries")<
	RouteEntries,
	Record<string, string>
>() {}

export const getRouteEntries = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;

	const entries: Record<string, string> = {};

	const files = yield* fs.readDirectory(routeDir, { recursive: true });

	const routeFiles = files.filter((file) => file.endsWith(".tsx"));

	for (const routeFile of routeFiles) {
		const route = `src/${routeFile}`;
		const routeId = route.replace("src/", "").replace(".tsx", "");

		entries[routeId] = route.replace("src/", `./${routeDir}/`);
	}

	return entries;
}).pipe(Effect.provide(NodeContext.layer));

export const RouteEntriesLive = Layer.effect(RouteEntries, getRouteEntries);

export const bundleEntryPoints = Effect.gen(function* () {
	const routeEntries = yield* RouteEntries;

	return {
		"entry-client": "./src/entry-client.tsx",
		...routeEntries,
	};
});

export const routeURLPatterns = Effect.gen(function* () {
	const entries = yield* RouteEntries;

	return Object.keys(entries).map(
		(key) =>
			new URLPattern({
				pathname: transformRoutePath(key),
				baseURL: origin,
			}),
	);
});

function transformRoutePath(path: string): string {
	// Replace index routes with empty string or parent path
	let transformedPath = path.replace(/\/index$/, "").replace("index", "");

	// Handle dynamic segments [param] -> :param
	transformedPath = transformedPath.replace(/\[([^\]]+)]/g, ":$1");

	return `/${transformedPath}`;
}

export const matchRoute = (path: string) =>
	Effect.gen(function* () {
		const entries = yield* RouteEntries;
		const patterns = yield* routeURLPatterns;

		for (let i = 0; i < patterns.length; i++) {
			const pattern = patterns[i];
			const result = pattern.exec(path, origin);
			if (result) {
				const entry = Object.values(entries)[i];
				return { entry, result };
			}
		}

		return null;
	});
