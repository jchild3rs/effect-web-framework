import "./style.css";
import { type AnyComponent, hydrate } from "preact";

async function mount(Comp: AnyComponent, elm: HTMLElement) {
	if (elm.dataset.mounted === "true") return;

	let props = {};

	if (elm.dataset.props) {
		props = JSON.parse(elm.dataset.props);
		delete elm.dataset.props;
	}

	hydrate(<Comp {...props} />, elm);
	elm.dataset.mounted = "true";
}

async function hydrateIslands() {
	if (typeof document === "undefined") return;

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
