import { Effect } from "effect";
import type { Metadata } from "~/lib/types.ts";

export const meta: Metadata = { title: "Blog" };

export const load = () =>
	Effect.succeed({
		posts: [] as Array<{ id: string; title: string }>, // fake
	});

export const page = Effect.succeed(
	(props: Effect.Effect.Success<ReturnType<typeof load>>) => (
		<div>
			blog index!
			{props.posts.map((post) => (
				<div key={post.id}>{post.title}</div>
			))}
		</div>
	),
);
