import type { ComponentChild, ComponentConstructor, JSX } from "preact";

function Island<Props extends Record<string, unknown>>(props: {
	component: (props: Props) => JSX.Element;
	fileName: string;
	loading?: "eager" | "lazy";
	props?: Props;
	children?: ComponentChild;
}) {
	const Component = props.component as unknown as ComponentConstructor;

	return (
		<div
			data-island
			data-loading={props.loading ?? "lazy"}
			// data-file={props.children?.type?.name?.toLowerCase()}
			data-file={props.fileName}
			data-props={JSON.stringify(props.props)}
			style={{ display: "contents" }}
		>
			<Component {...props.props} />
		</div>
	);
}

export default Island;
