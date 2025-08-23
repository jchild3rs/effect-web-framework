import type { HttpServerResponse } from "@effect/platform";
import type { Effect, Schema } from "effect";
import type { AnyComponent } from "preact";

export type RenderFunction = (
	html: string,
	head: string,
) => HttpServerResponse.HttpServerResponse;

export type RouteHandler = (
	context: RouteContext,
	template: string,
	routeModule: RouteModule,
) => Effect.Effect<HttpServerResponse.HttpServerResponse>;

export type RouteContext = {
	searchParams: Readonly<URLSearchParams>;
	params: Record<string, string | undefined>;
	routeId?: string;
	routeType: "page" | "data";
};

export type Metadata = {
	title?: string;
	description?: string;
	keywords?: string;
};

export type RouteLoadFn<
	Props extends Record<string, unknown> = Record<string, unknown>,
> = (context: RouteContext) => Effect.Effect<Props, unknown>;

export type RouteDataFn<T> = (context: RouteContext) => Effect.Effect<T>;

export type RouteModule<
	Props extends Record<string, unknown> = Record<string, unknown>,
> = {
	page?: Effect.Effect<AnyComponent<Props>>;
	load?: RouteLoadFn<Props>;
	meta?:
		| Metadata
		| ((context: RouteContext) => Effect.Effect<Metadata, unknown>);
	paramSchema?: Schema.Schema.Any;
};
// | {
// 		GET?: RouteDataFn<Props>;
// 		POST?: RouteDataFn<Props>;
// 		PUT?: RouteDataFn<Props>;
// 		DELETE?: RouteDataFn<Props>;
// 		PATCH?: RouteDataFn<Props>;
//   };
