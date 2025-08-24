import { Effect, Option, Schema } from "effect";
import { RouteEntries } from "~/lib/bundle-entry-points.ts";
import { origin } from "~/lib/config.ts";

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
