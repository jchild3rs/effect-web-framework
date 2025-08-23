import { useState } from "preact/hooks";

const Counter = (props: { initialCount?: number }) => {
	const [count, setCount] = useState<number>(props.initialCount ?? 0);

	return (
		<div id="test" style={{ padding: "2rem", textAlign: "center" }}>
			<h2>Counter: {count}</h2>
			<div
				style={{
					display: "flex",
					gap: "1rem",
					justifyContent: "center",
				}}
			>
				<button type="button" onClick={() => setCount((c) => c - 1)}>
					Decrease
				</button>
				<button type="button" onClick={() => setCount((c) => c + 1)}>
					Increase
				</button>
			</div>
		</div>
	);
};

export default Counter;
