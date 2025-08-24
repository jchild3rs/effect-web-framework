import { Context, Effect, Layer } from "effect";
import { v7 } from "uuid";

export class Uuid extends Context.Tag("Uuid")<
	Uuid,
	{ readonly generate: Effect.Effect<string> }
>() {}

export const UuidLive = Layer.succeed(Uuid, {
	generate: Effect.sync(() => v7()),
} as const);

export const UuidTest = Layer.succeed(Uuid, {
	generate: Effect.succeed("test-uuid"),
} as const);
