import { FileSystem } from "@effect/platform";
import { Context, Effect, Layer, Option, Schema } from "effect";
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

// const URLPatternFromSelf = Schema.declare(
// 	(input: unknown): input is URLPattern => {
// 		return typeof input === "object" && input !== null && "pathname" in input;
// 	},
// );

const URLPatternResultFromSelf = Schema.declare(
	(input: unknown): input is URLPatternResult => {
		return typeof input === "object" && input !== null && "pathname" in input;
	},
);

const MatchedRoute = Schema.Struct({
	entry: Schema.String,
	result: URLPatternResultFromSelf,
});
export type MatchedRoute = typeof MatchedRoute.Type;

export const matchRoute = (path: string) =>
	Effect.gen(function* () {
		const entries = Object.entries(yield* RouteEntries);

		for (let i = 0; i < entries.length; i++) {
			const [, entry] = entries[i];
			const result = entry.pattern.exec(path, origin);
			if (result) {
				return Option.some(MatchedRoute.make({ entry: entry.path, result }));
			}
		}

		return Option.none();
	});
