import type { HttpServerResponse } from "@effect/platform";
import type { Effect } from "effect";
import type { JSX } from "preact";
import type { Locals } from "~/lib/locals.ts";
import type { allowedAPIMethods } from "./config";

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

export type Page = {
	body: JSX.Element;
	meta?: JSX.Element;
};

// type test = Data.TaggedEnum<{
// 	DataRoute: {
// 		[P in (typeof allowedAPIMethods)[number]]?: RouteDataFn;
// 	};
// 	PageRoute: {
// 		page?: Effect.Effect<Page, unknown, Locals>;
// 	};
// }>;
//
// export const { DataRoute, PageRoute } = Data.taggedEnum<test>();

export type PageRouteModule = {
	page?: Effect.Effect<Page, unknown, Locals>;
};

export type DataRouteModule = {
	[P in (typeof allowedAPIMethods)[number]]?: RouteDataFn;
};

export type RouteModule = PageRouteModule | DataRouteModule;
