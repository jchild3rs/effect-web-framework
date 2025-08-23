import { Effect, Schema } from "effect";
import type { Metadata, RouteContext } from "~/lib/types.ts";

export const meta: Metadata = { title: "Blog Post" };

const BlogPostParamSchema = Schema.Struct({ id: Schema.NonEmptyString });

export const page = (context: RouteContext) =>
	Effect.gen(function* () {
		const params = yield* Schema.validate(BlogPostParamSchema)(
			context.pathParams,
		);

		return () => <div>blog post! ID: {params.id}</div>;
	});
