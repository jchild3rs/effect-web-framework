import { createServer } from "node:http";
import {
  FileSystem,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import {
  NodeContext,
  NodeHttpServer,
  NodeHttpServerRequest,
  NodeRuntime,
} from "@effect/platform-node";
import { Context, Effect, Layer, Option } from "effect";

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || "5173");
const base = process.env.BASE || "/";

class HtmlTemplate extends Context.Tag("HtmlTemplate")<
  HtmlTemplate,
  string
>() {}

const HtmlTemplateLive = Layer.effect(
  HtmlTemplate,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = `${import.meta.dirname}${isProduction ? "/dist/client/index.html" : "/index.html"}`;
    return yield* fs.readFileString(path);
  }),
);

// let viteDevServer: ViteDevServer | null = null;

// if (!isProduction) {
//   const { createServer: createViteDevServer } = await import("vite");
//   viteDevServer = await createViteDevServer({
//     server: { middlewareMode: true },
//     appType: "custom",
//     base,
//   });
// }

class ViteDevServer extends Context.Tag("ViteDevServer")<
  ViteDevServer,
  import("vite").ViteDevServer
>() {}

const ViteDevServerLive = Layer.effect(
  ViteDevServer,
  Effect.gen(function* () {
    const { createServer: createViteDevServer } = yield* Effect.promise(
      () => import("vite"),
    );

    return yield* Effect.promise(() =>
      createViteDevServer({
        server: { middlewareMode: true },
        appType: "custom",
        base,
      }),
    );
  }),
);

const viteDevServerMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function* () {
    if (!isProduction) {
      const viteDevServer = yield* ViteDevServer;
      const request = yield* HttpServerRequest.HttpServerRequest;

      yield* Effect.async<void, Error>((resume) => {
        viteDevServer.middlewares.handle(
          NodeHttpServerRequest.toIncomingMessage(request),
          NodeHttpServerRequest.toServerResponse(request),
          (err: Error) => {
            resume(err ? Effect.fail(err) : Effect.void);
          },
        );
      });
    }

    return yield* app;
  }),
);

class BuiltStaticAssets extends Context.Tag("BuiltStaticAssets")<
  BuiltStaticAssets,
  string[]
>() {}

const BuiltStaticAssetsLive = Layer.effect(
  BuiltStaticAssets,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    return yield* fs.readDirectory("./dist/client", {
      recursive: true,
    });
  }),
);

const viteStaticAssetsMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function* () {
    if (isProduction) {
      const request = yield* HttpServerRequest.HttpServerRequest;

      const assets = yield* BuiltStaticAssets;

      const matchedPath = assets.find((asset) =>
        `/${asset}`.endsWith(request.url),
      );

      if (matchedPath) {
        return yield* HttpServerResponse.file(`./dist/client/${matchedPath}`);
      }
    }

    return yield* app;
  }),
);

const viteRouteHandler = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest;
  const url = req.originalUrl;

  const fs = yield* FileSystem.FileSystem;

  let template: string;
  let handle: typeof import("./src/entry-server.ts").handle;

  if (!isProduction) {
    const viteDevServer = yield* ViteDevServer;
    template = yield* fs.readFileString(`${import.meta.dirname}/index.html`);

    template = yield* Effect.promise(() =>
      viteDevServer.transformIndexHtml(url, template),
    );

    const renderModule = yield* Effect.promise(() =>
      viteDevServer.ssrLoadModule("/src/entry-server.ts"),
    );
    handle = renderModule.handle;
  } else {
    template = yield* HtmlTemplate;

    const serverEntry = yield* Effect.promise(
      () => import("./dist/server/entry-server.js"),
    );

    handle =
      serverEntry.handle as typeof import("./src/entry-server.ts").handle;
  }

  return yield* handle((html, head) =>
    HttpServerResponse.html(
      template
        .replace(`<!--app-head-->`, head ?? "")
        .replace(`<!--app-body-->`, html ?? ""),
    ),
  ).pipe(Effect.withSpan("handle"));
});

const router = HttpRouter.empty.pipe(
  HttpRouter.all("*", viteRouteHandler),
  HttpRouter.use(viteDevServerMiddleware),
  HttpRouter.use(viteStaticAssetsMiddleware),
);

const app = router.pipe(
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      if (!isProduction) {
        const viteDevServer = yield* ViteDevServer;
        viteDevServer.ssrFixStacktrace(error);
      }

      yield* Effect.logError(error);

      // TODO: maybe static 500.html file (that goes through vite)
      return yield* HttpServerResponse.text("Internal Server Error", {
        status: 500,
      });
    }),
  ),
  HttpServer.serve(),
  HttpServer.withLogAddress,
);

const ServerLive = NodeHttpServer.layer(() => createServer(), { port });

const AppLive = Layer.mergeAll(
  ServerLive,
  HtmlTemplateLive,
  BuiltStaticAssetsLive,
  ViteDevServerLive,
);

NodeRuntime.runMain(
  Layer.launch(Layer.provide(app, AppLive)).pipe(
    Effect.provide(NodeContext.layer),
  ),
);
