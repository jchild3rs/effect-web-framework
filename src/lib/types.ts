import type { HttpServerResponse } from "@effect/platform";
import type { Effect } from "effect";
import type { AnyComponent } from "preact";
import type { allowAPIMethods } from "./config";

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
	queryParams: Readonly<URLSearchParams>;
	pathParams: Record<string, string | undefined>;
	requestId: string;
	routeId: string;
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

export type RouteDataFn = (
	context: RouteContext,
) => HttpServerResponse.HttpServerResponse;

export type RouteModule<
	Props extends Record<string, unknown> = Record<string, unknown>,
> = {
	[P in (typeof allowAPIMethods)[number]]?: RouteDataFn;
} & {
	page?: (context: RouteContext) => Effect.Effect<AnyComponent<Props>>;
	meta?:
		| Metadata
		| ((context: RouteContext) => Effect.Effect<Metadata, unknown>);
	// [key: typeof allowAPIMethods[number]]: RouteDataFn
};
