import type { HttpServerResponse } from "@effect/platform";
import type { Effect } from "effect";
import type { DocumentParts } from "~/lib/document.ts";
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

export type PageRouteModule = {
	Page?: Effect.Effect<DocumentParts, unknown, Locals>;
};

type AllowedAPIMethods = (typeof allowedAPIMethods)[number];

export type DataRouteModule = {
	[Method in AllowedAPIMethods]?: RouteDataFn;
};

export type RouteModule = PageRouteModule | DataRouteModule;
