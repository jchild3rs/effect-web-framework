import { Effect } from "effect";
import { Redirect } from "~/lib/route-handler";

export const page = Effect.gen(function* () {
	return yield* Effect.fail(new Redirect("/blog/2")); // optional status arg `new Redirect('/', 302)`
});
