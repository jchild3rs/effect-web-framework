import { Context, Effect, Layer } from "effect";

export class ProductionClientManifest extends Context.Tag(
	"ProductionClientManifest",
)<
	ProductionClientManifest,
	typeof import("../../dist/client/.vite/manifest.json")
>() {}

const ProductionClientManifestLive = Layer.effect(
	ProductionClientManifest,
	Effect.tryPromise(() =>
		import("../../dist/client/.vite/manifest.json", {
			with: { type: "json" },
		}).then((mod) => mod.default),
	),
);

export class ProductionServerManifest extends Context.Tag(
	"ProductionServerManifest",
)<
	ProductionServerManifest,
	typeof import("../../dist/server/.vite/manifest.json")
>() {}

const ProductionServerManifestLive = Layer.effect(
	ProductionServerManifest,
	Effect.tryPromise(() =>
		import("../../dist/server/.vite/manifest.json", {
			with: { type: "json" },
		}).then((mod) => mod.default),
	),
);

export const ManifestLive = Layer.mergeAll(
	ProductionClientManifestLive,
	ProductionServerManifestLive,
);
