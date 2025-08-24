import { defineConfig } from "vite";

export default defineConfig({
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
