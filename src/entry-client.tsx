import "./style.css";
import { hydrate } from "preact";

async function hydrateIslands() {
	if (typeof document === "undefined") return;

	async function mount(
		Comp: import("preact").FunctionComponent,
		elm: HTMLElement,
	) {
		let props = {};

		if (elm?.dataset?.props) {
			props = JSON.parse(elm.dataset.props);
			delete elm.dataset.props;
		}

		hydrate(<Comp {...props} />, elm);
	}

	for (const eagerIsland of document.querySelectorAll(
		"[data-island][data-loading='eager']",
	) as unknown as HTMLDivElement[]) {
		void mount(
			(await import(`./islands/${eagerIsland.dataset.file}.tsx`)).default,
			eagerIsland,
		);
	}

	for (const island of document.querySelectorAll(
		"[data-island][data-loading='lazy']",
	) as unknown as HTMLDivElement[]) {
		const observer = new IntersectionObserver(async (entries) => {
			const entry = entries[0];
			if (!entry.isIntersecting) return;

			if (island instanceof HTMLElement && island.dataset.file) {
				void mount(
					(await import(`./islands/${island.dataset.file}.tsx`)).default,
					island,
				);
			}
		});

		observer.observe(island.firstElementChild as HTMLElement);
	}
}

void hydrateIslands();
