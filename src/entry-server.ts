import { Effect } from "effect";
import type { RouteHandler } from "../lib/types";

const htmlRouteExample: RouteHandler = (render) => {
  // return Effect.fail(new Error("Not implemented"));
  return render("<div>hello</div>", "<title>Home</title>");
};

export const handle = htmlRouteExample;

// const dataRouteExample: RouteHandler = () =>
//   HttpServerResponse.unsafeJson({ foO: "bar" });
// export const handle = dataRouteExample
