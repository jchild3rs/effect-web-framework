import { Data } from "effect";

export class NotFoundError extends Data.TaggedError("NotFound") {}

export class Redirect extends Data.TaggedError("Redirect") {
	public readonly location: string;
	public readonly status: number = 302;

	constructor(_location: string, _status?: number) {
		super();
		this.location = _location;
		if (_status) {
			this.status = _status;
		}
	}
}
