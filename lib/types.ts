import type { HttpServerResponse } from "@effect/platform";
import type { Effect } from "effect";

export type RenderFunction = (
  html: string,
  head: string,
) => HttpServerResponse.HttpServerResponse;

export type RouteHandler = (
  render: RenderFunction,
) => Effect.Effect<HttpServerResponse.HttpServerResponse, Error>;
