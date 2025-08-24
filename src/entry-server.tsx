import { HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import renderToString, { renderToStringAsync } from "preact-render-to-string";
import {
	allowedAPIMethods,
	templateBodyToken,
	templateHeadToken,
} from "./lib/config.ts";
import { NotFoundError, type Redirect } from "./lib/errors.ts";
import type {
	DataRouteModule,
	RouteContext,
	RouteModule,
} from "./lib/types.ts";

export const handleRoute = (
	context: RouteContext,
	template: string,
	routeModule: RouteModule,
) =>
	Effect.gen(function* () {
		const request = yield* HttpServerRequest.HttpServerRequest;

		let body = "";
		let head = "";

		if (routeModule) {
			if ("Page" in routeModule && routeModule.Page) {
				const pageRouteModule = yield* routeModule.Page;
				head = pageRouteModule.meta ? renderToString(pageRouteModule.meta) : "";

				const stringOrAsync = renderToStringAsync(pageRouteModule.body);
				if (typeof stringOrAsync === "string") {
					body = stringOrAsync;
				} else {
					body = yield* Effect.tryPromise(() => stringOrAsync);
				}
			} else {
				const mod = routeModule as DataRouteModule; // todo give love/dont want to assert

				for (const method of allowedAPIMethods) {
					if (
						method in routeModule &&
						mod[method] &&
						request.method === method
					) {
						return yield* mod[method](context);
					}
				}
			}

			return HttpServerResponse.html(
				template
					.replace(templateHeadToken, head)
					.replace(templateBodyToken, body),
			);
		}

		return yield* Effect.fail(new NotFoundError());
	}).pipe(
		Effect.catchTags({
			NotFound: () => HttpServerResponse.text("Not found", { status: 404 }),
			Redirect: (redirect: Redirect) =>
				HttpServerResponse.redirect(redirect.location, {
					status: redirect.status,
				}),
		}),
	);
