import { Effect, Schema } from "effect";
import { PostAPI } from "~/domain/post/api.ts";
import { NotFoundError } from "~/lib/errors.ts";
import { RouteContext } from "~/lib/route-context";
import type { Page } from "~/lib/types.ts";

const BlogPostParamSchema = Schema.Struct({ id: Schema.NonEmptyString });

export const page = Effect.gen(function* () {
	const context = yield* RouteContext;

	const params = yield* Schema.validate(BlogPostParamSchema)(
		context.pathParams,
	);

	const response = yield* PostAPI.byId(params.id);

	if (response.status === 404) {
		return yield* Effect.fail(new NotFoundError());
	}

	return {
		meta: <title>{response.body.title} | Blog</title>,
		body: (
			<div>
				blog post! ID: {params.id}
				<pre>{JSON.stringify(response.body, null, 2)}</pre>
			</div>
		),
	} satisfies Page;
}).pipe(Effect.provide(PostAPI.Default));
