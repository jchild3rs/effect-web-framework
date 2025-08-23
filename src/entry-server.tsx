import { HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect, type Option } from "effect";
import { Fragment } from "preact";
import renderToString, { renderToStringAsync } from "preact-render-to-string";
import {
	allowedAPIMethods,
	templateBodyToken,
	templateHeadToken,
} from "./lib/config.ts";
import type { Metadata, RouteContext, RouteModule } from "./lib/types.ts";

export const handleRoute = (
	context: RouteContext,
	template: string,
	routeModule: Option.Option<RouteModule>,
) =>
	Effect.gen(function* () {
		console.log({ routeModule });
		const request = yield* HttpServerRequest.HttpServerRequest;

		let html: string = "";
		let head: string = "";
		let status = 404;

		if (routeModule._tag === "Some") {
			status = 200;
			if (
				"page" in routeModule.value &&
				typeof routeModule.value.page === "function"
			) {
				let meta: Metadata | undefined;

				if (typeof routeModule.value.meta === "function") {
					meta = yield* routeModule.value.meta(context);
				} else {
					meta = routeModule.value.meta;
				}

				head = meta
					? renderToString(
							<Fragment>
								<title>{meta.title}</title>
								<meta name="description" content={meta.description} />
							</Fragment>,
						)
					: "";

				const Page = yield* routeModule.value.page(context);
				const stringOrAsync = renderToStringAsync(<Page />);

				if (typeof stringOrAsync === "string") {
					html = stringOrAsync;
				} else {
					html = yield* Effect.tryPromise(() => stringOrAsync);
				}
			} else {
				for (const method of allowedAPIMethods) {
					if (
						method in routeModule.value &&
						routeModule.value[method] &&
						request.method === method
					) {
						return yield* routeModule.value[method](context);
					}
				}
			}
		}

		return HttpServerResponse.raw(
			template
				.replace(templateHeadToken, head ?? "")
				.replace(templateBodyToken, html ?? "Not found"),
			{ contentType: "text/html", status },
		);
	});
