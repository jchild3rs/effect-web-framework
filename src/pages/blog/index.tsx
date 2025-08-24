import { Effect } from "effect";
import { PostAPI } from "~/domain/post/api.ts";

export const page = Effect.gen(function* () {
	const { body: allPosts } = yield* PostAPI.all;

	return {
		meta: <title>Blog Posts</title>,
		body: (
			<>
				<a href="/blog">Blog</a>
				<a href="/blog/123">A Post</a>

				{allPosts.map((post) => (
					<div key={post.id}>
						<a href={`/blog/${post.id}`}>{post.title}</a>
					</div>
				))}

				{/*for testing scroll observing/lazy hydration*/}
				<div style={{ height: 2000 }}></div>
			</>
		),
	};
}).pipe(Effect.provide(PostAPI.Default));
