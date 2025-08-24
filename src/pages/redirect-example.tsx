import { Effect } from "effect";
import { Redirect } from "~/lib/errors.ts";

export const page = Effect.gen(function* () {
	return yield* Effect.fail(new Redirect("/blog/2"));
});
