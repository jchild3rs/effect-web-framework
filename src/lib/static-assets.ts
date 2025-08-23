import { FileSystem } from "@effect/platform";
import { Context, Effect, Layer } from "effect";
import { isProduction } from "./config.ts";

export class BuiltStaticAssets extends Context.Tag("BuiltStaticAssets")<
	BuiltStaticAssets,
	string[]
>() {}

export const BuiltStaticAssetsLive = Layer.effect(
	BuiltStaticAssets,
	!isProduction
		? Effect.succeed([])
		: Effect.gen(function* () {
				const fs = yield* FileSystem.FileSystem;

				return yield* fs.readDirectory("./dist/client", {
					recursive: true,
				});
			}),
);
