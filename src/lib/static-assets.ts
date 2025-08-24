import { FileSystem } from "@effect/platform";
import { Context, Effect, Layer } from "effect";
import { isProduction } from "./config.ts";

export class StaticAssets extends Context.Tag("StaticAssets")<
	StaticAssets,
	string[]
>() {}

export const BuiltStaticAssetsLive = Layer.effect(
	StaticAssets,
	!isProduction
		? Effect.succeed([])
		: Effect.gen(function* () {
				const fs = yield* FileSystem.FileSystem;

				return yield* fs.readDirectory("./dist/client", {
					recursive: true,
				});
			}),
);
