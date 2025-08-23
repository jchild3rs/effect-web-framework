import { HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { Fragment } from "preact";
import renderToString, { renderToStringAsync } from "preact-render-to-string";
import type { Metadata, RouteContext, RouteModule } from "./lib/types.ts";

export const handleRoute = (
	context: RouteContext,
	template: string,
	routeModule: RouteModule,
) =>
	Effect.gen(function* () {
		if (routeModule.page) {
			let props = {};
			let meta: Metadata | undefined;

			const Page = yield* routeModule.page;

			if (typeof routeModule.load === "function") {
				props = yield* routeModule.load(context);
			}

			if (typeof routeModule.meta === "function") {
				meta = yield* routeModule.meta(context);
			} else {
				meta = routeModule.meta;
			}

			const head = meta
				? renderToString(
						<Fragment>
							<title>{meta.title}</title>
							<meta name="description" content={meta.description} />
						</Fragment>,
					)
				: null;

			const renderResult = renderToStringAsync(<Page {...props} />);

			let html: string;
			if (typeof renderResult === "string") {
				html = renderResult;
			} else {
				html = yield* Effect.tryPromise(() => renderResult);
			}

			return HttpServerResponse.html(
				template
					.replace(`<!--app-head-->`, head ?? "")
					.replace(`<!--app-body-->`, html ?? ""),
			);
		}

		return HttpServerResponse.text("Not found", { status: 404 });
	});
