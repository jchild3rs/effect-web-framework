import {
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { OkPost, OkPosts, PostNotFound } from "./schema.ts";

const makePostAPI = Effect.gen(function* () {
	const defaultClient = yield* HttpClient.HttpClient;
	const client = defaultClient.pipe(
		HttpClient.mapRequest(
			HttpClientRequest.prependUrl("https://jsonplaceholder.typicode.com"),
		),
	);

	const all = client
		.get("/posts")
		.pipe(
			Effect.flatMap(HttpClientResponse.schemaJson(OkPosts)),
			Effect.withSpan("fetch-all-posts"),
		);

	const byId = (id: string) =>
		client
			.get(`/posts/${id}`)
			.pipe(
				Effect.flatMap(
					HttpClientResponse.schemaJson(Schema.Union(OkPost, PostNotFound)),
				),
				Effect.withSpan("fetch-post-by-id"),
			);

	return {
		all,
		byId,
	} as const;
});

export class PostAPI extends Effect.Service<PostAPI>()("PostAPI", {
	effect: makePostAPI.pipe(Effect.annotateSpans("name", "post-api")),
	accessors: true,
}) {}
