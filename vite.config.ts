import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: { alias: { "~": path.resolve(__dirname, "./src") } },
	build: {
		manifest: true,
		outDir: "dist/client",
		rollupOptions: {
			input: {
				global: "src/entry-client.tsx",
			},
		},
	},
});
