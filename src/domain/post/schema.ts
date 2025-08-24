import { Schema } from "effect";

export const Post = Schema.Struct({
	userId: Schema.Number,
	id: Schema.Number,
	title: Schema.NonEmptyString,
	body: Schema.NonEmptyString,
});

export const OkPost = Schema.Struct({
	status: Schema.Union(Schema.Literal(200)),
	body: Post,
});

export const PostNotFound = Schema.Struct({
	status: Schema.Union(Schema.Literal(404)),
});

const Posts = Schema.Array(Post);

export const OkPosts = Schema.Struct({
	status: Schema.Literal(200),
	body: Posts,
});
