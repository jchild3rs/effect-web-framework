import { Effect } from "effect";
import { Redirect } from "../lib/redirect.ts";

export const Page = Effect.gen(function* () {
	return yield* Effect.fail(new Redirect("/blog/2")); // optional status arg `new Redirect('/', 302)`
});
