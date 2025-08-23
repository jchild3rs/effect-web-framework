import { Effect, Schema } from "effect";
import type { Metadata, RouteContext } from "~/lib/types.ts";

export const meta: Metadata = { title: "Blog Post" };

const BlogPostParamSchema = Schema.Struct({ id: Schema.NonEmptyString });

export const load = (context: RouteContext) =>
	Effect.gen(function* () {
		const params = yield* Schema.validate(BlogPostParamSchema)(context.params);

		return { postId: params.id } as const;
	});

export const page = Effect.succeed(
	(props: Effect.Effect.Success<ReturnType<typeof load>>) => (
		<div>blog post! ID: {props.postId}</div>
	),
);
