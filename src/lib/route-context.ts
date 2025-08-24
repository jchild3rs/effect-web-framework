import { Context, Schema } from "effect";

const URLSearchParamsFromSelf = Schema.declare(
	(input: unknown): input is URLSearchParams => {
		return input instanceof URLSearchParams;
	},
);

export const RouteContextData = Schema.mutable(
	Schema.Struct({
		queryParams: URLSearchParamsFromSelf,
		pathParams: Schema.Record({
			key: Schema.String,
			value: Schema.Union(Schema.String, Schema.Undefined),
		}),
		requestId: Schema.UUID,
		routeId: Schema.NonEmptyString,
		routeType: Schema.Union(Schema.Literal("data"), Schema.Literal("page")),
	}),
);

export class RouteContext extends Context.Tag("RouteContext")<
	RouteContext,
	typeof RouteContextData.Type
>() {}
