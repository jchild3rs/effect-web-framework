import {
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { OkPost, OkPosts, PostNotFound } from "~/domain/post/schema.ts";

const makeAPI = Effect.gen(function* () {
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
			Effect.withSpan("all-posts"),
		);

	const byId = (id: string) =>
		client
			.get(`/posts/${id}`)
			.pipe(
				Effect.flatMap(
					HttpClientResponse.schemaJson(Schema.Union(OkPost, PostNotFound)),
				),
				Effect.withSpan("post-by-id"),
			);

	return {
		all,
		byId,
	} as const;
}).pipe(Effect.annotateSpans("name", "post-api"));

export class PostAPI extends Effect.Service<PostAPI>()("PAPI", {
	effect: makeAPI,
	accessors: true,
}) {}
