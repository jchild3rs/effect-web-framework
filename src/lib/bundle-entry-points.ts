import { FileSystem } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { origin, routeDir } from "./config.ts";

export class RouteEntries extends Context.Tag("RouteEntries")<
	RouteEntries,
	Record<string, string>
>() {}

export const getRouteEntries = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;

	const entries: Record<string, string> = {};

	const files = yield* fs.readDirectory(routeDir, { recursive: true });

	for (const routeFile of files.filter((f) => f.includes("."))) {
		const route = `src/${routeFile}`;
		const routeId = route
			.replace("src/", "")
			.replace(".tsx", "")
			.replace(".ts", "");

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
		const entries = yield* RouteEntries;
		const patterns = yield* routeURLPatterns;

		for (let i = 0; i < patterns.length; i++) {
			const pattern = patterns[i];
			const result = pattern.exec(path, origin);
			if (result) {
				const entry = Object.values(entries)[i];
				return Option.some(MatchedRoute.make({ entry, result }));
			}
		}

		return Option.none();
	});
