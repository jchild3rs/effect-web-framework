import { FileSystem } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { defineConfig, type ViteDevServer } from "vite";

const plugin = (server: ViteDevServer) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const routesFolderExists = yield* fs.exists("./src/routes");
    if (!routesFolderExists) {
      return yield* Effect.fail(
        new Error("Routes directory (/src/routes) does not exist"),
      );
    }

    const routes = yield* fs.readDirectory("./src/routes", { recursive: true });
    yield* Console.log(routes);
  });

export default defineConfig({
  // server: {
  //   cors: {
  //     // the origin you will be accessing via browser
  //     origin: "http://my-backend.example.com",
  //   },
  // },
  // build: {
  //   // generate .vite/manifest.json in outDir
  //   manifest: true,
  //   rollupOptions: {
  //     // overwrite default .html entry
  //     input: "/path/to/main.js",
  //   },
  // },
  plugins: [
    {
      name: "custom-middleware-example-plugin",
      options: async (options) => {
        console.log(options);
        return options;
      },
      optimizeDeps: [],
    },
  ],
});
