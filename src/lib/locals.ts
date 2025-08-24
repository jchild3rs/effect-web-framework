import { Context } from "effect";

export class Locals extends Context.Tag("Locals")<
	Locals,
	Record<string, unknown>
>() {}
