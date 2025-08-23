import { Effect, Schema } from "effect";
import type { Metadata, RouteContext } from "~/lib/types.ts";

export const meta: Metadata = { title: "Blog Post" };

const BlogPostParamSchema = Schema.Struct({ id: Schema.NonEmptyString });

function Page(props: { id: string }) {
	return <div>blog post! ID: {props.id}</div>;
}

export const page = (context: RouteContext) =>
	Effect.gen(function* () {
		const params = yield* Schema.validate(BlogPostParamSchema)(
			context.pathParams,
		);

		return () => <Page id={params.id} />;
	});
