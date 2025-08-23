import type { ManifestChunk } from "vite";

export function html(
	isDev: boolean,
	manifest?: typeof import("../../dist/client/.vite/manifest.json"),
	routeEntry?: ManifestChunk,
) {
	// loading here in head (along with the module) mainly to prevent FOUC in dev mode
	const devStyles = isDev
		? `<link rel="stylesheet" href="/src/style.css" />`
		: ``;

	const devScript = isDev
		? `<script type="module" src="/src/entry-client.tsx"></script>`
		: ``;

	const mainEntry = manifest?.["src/entry-client.tsx"];

	const globalStyles = mainEntry?.css
		? `<link rel="stylesheet" href="/${mainEntry.css}" />`
		: ``;

	const globalScript = mainEntry?.file
		? `<script type="module" src="/${mainEntry.file}"></script>`
		: ``;

	const routeStyles = routeEntry?.css
		? `<link rel="stylesheet" href="/${routeEntry.css}" />`
		: ``;

	const routeScript = routeEntry?.file
		? `<script type="module" src="/${routeEntry.file}"></script>`
		: ``;

	return `<!doctype html>
<html lang="en">
	<head>
		<!--app-head-->
		<meta charset="UTF-8" />
		${devStyles}
		${globalStyles}
		${routeStyles}
	</head>
  <body>
		<div id="app" style="display: contents">
			<!--app-body-->
		</div>

		${devScript}  
		${globalScript}
		${routeScript}
    </body>
</html>`;
}
