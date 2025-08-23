import { HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";

export const SearchParams = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const searchParams = new URLSearchParams();

	for (const keyVal of request.url.split("?")[1]?.split("&") ?? []) {
		const [key, value] = keyVal.split("=");
		searchParams.append(key, value);
	}

	return searchParams as Readonly<
		Omit<URLSearchParams, "set" | "append" | "delete" | "sort">
	>;
});
