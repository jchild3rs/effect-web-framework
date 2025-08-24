import("urlpattern-polyfill");

import { NodeContext } from "@effect/platform-node";
import { Effect } from "effect";
import { defineConfig } from "vite";
import {
	bundleEntryPoints,
	RouteEntriesLive,
} from "./src/lib/bundle-entry-points";

const routeEntries = await Effect.runPromise(
	bundleEntryPoints.pipe(
		Effect.map((entries) =>
			Object.entries(entries).reduce<Record<string, string>>(
				(acc, [key, value]) => {
					acc[key] = value.path;
					return acc;
				},
				{},
			),
		),
		Effect.provide(RouteEntriesLive),
		Effect.provide(NodeContext.layer),
	),
);

export default defineConfig({
	plugins: [
		{
			name: "build-config",
			config(config, env) {
				const main = `src/entry-${env.isSsrBuild ? "server" : "client"}.tsx`;

				const input = {
					main,
					...(env.isSsrBuild && routeEntries),
				};

				const outDir = `dist/${env.isSsrBuild ? "server" : "client"}`;

				config.build = {
					manifest: true,
					ssr: env.isSsrBuild,
					outDir,
					rollupOptions: {
						input,
						output: {
							entryFileNames: "[name]-[hash].js",
							chunkFileNames: "[name]-[hash].js",
							assetFileNames: "[name]-[hash].[ext]",
						},
					},
				};

				return config;
			},
		},
	],
});
