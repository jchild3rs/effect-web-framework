import { Effect } from "effect";
import Counter from "~/islands/counter.tsx";
import Island from "~/lib/island.tsx";
import type { RouteContext } from "~/lib/types.ts";

export const meta = (_context: RouteContext) =>
	Effect.succeed({ title: "Page title" });

export const page = Effect.succeed(() => (
	<>
		<a href="/blog">Blog</a>
		<a href="/blog/123">A Post</a>

		{/*for testing scroll observing/lazy hydration*/}
		<div style={{ height: 2000 }}></div>

		<Island
			fileName="counter"
			component={Counter}
			props={{ initialCount: 10 }}
		/>
	</>
));
