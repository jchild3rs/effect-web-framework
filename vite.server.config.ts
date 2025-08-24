import("urlpattern-polyfill");

import path from "node:path";
import { NodeContext } from "@effect/platform-node";
import { Config, Effect } from "effect";
import { defineConfig } from "vite";
import {
	bundleEntryPoints,
	RouteEntriesLive,
} from "./src/lib/bundle-entry-points";
import { origin } from "./src/lib/config";

const bundleEntries = await Effect.runPromise(
	bundleEntryPoints.pipe(
		Effect.map((entries) =>
			Object.entries(entries).reduce((acc, [key, value]) => {
				acc[key] = value.path;
				return acc;
			}, {}),
		),
		Effect.provide(RouteEntriesLive),
		Effect.provide(NodeContext.layer),
	),
);
console.log({ bundleEntries });

// the origin you will be accessing via browser
const ORIGIN = await Effect.runPromise(
	Config.string("ORIGIN").pipe(Config.withDefault(origin)),
);

export default defineConfig({
	resolve: { alias: { "~": path.resolve(__dirname, "./src") } },
	server: { cors: { origin: ORIGIN } },
	build: {
		manifest: true,
		ssr: true,
		outDir: "dist/server",
		rollupOptions: {
			input: {
				...bundleEntries,
				"entry-server": "src/entry-server.tsx",
			},
		},
	},
});
