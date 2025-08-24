import { Effect, Schema } from "effect";
import { PostAPI } from "~/domain/post/api.ts";
import { DocumentParts } from "~/lib/document.ts";
import { RouteContext } from "~/lib/route-context";
import { NotFoundError } from "~/lib/route-handler.ts";

const BlogPostParamSchema = Schema.Struct({ id: Schema.NonEmptyString });

export const Page = Effect.gen(function* () {
	const context = yield* RouteContext;

	const params = yield* Schema.validate(BlogPostParamSchema)(
		context.pathParams,
	).pipe(Effect.withSpan("validate-params"));

	const response = yield* PostAPI.byId(params.id);

	if (response.status === 404) {
		return yield* Effect.fail(new NotFoundError());
	}

	return DocumentParts.make({
		meta: <title>{response.body.title} | Blog</title>,
		body: (
			<div>
				blog post! ID: {params.id}
				<pre>{JSON.stringify(response.body, null, 2)}</pre>
			</div>
		),
	});
}).pipe(Effect.provide(PostAPI.Default), Effect.withSpan("blog-page-by-id"));
