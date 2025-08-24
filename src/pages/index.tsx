import { Effect } from "effect";
import Counter from "~/islands/counter.tsx";
import Island from "~/lib/island.tsx";
import { Locals } from "~/lib/locals.ts";
import type { Page } from "~/lib/types.ts";

export const page = Effect.gen(function* () {
	const locals = yield* Locals;

	return {
		body: (
			<>
				<a href="/blog">Blog</a>
				<a href="/blog/1">A Post</a>
				Request ID: {locals.requestId}
				<h1>Scroll Down to see lazy hydrated island</h1>
				{/*for testing scroll observing/lazy hydration*/}
				<div style={{ height: 2000 }}></div>
				<Island
					fileName="counter"
					component={Counter}
					props={{ initialCount: 10 }}
				/>
			</>
		),
		meta: <title>Page Title</title>,
	} satisfies Page;
});
