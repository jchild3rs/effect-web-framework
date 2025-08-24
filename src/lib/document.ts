import type { ManifestChunk } from "vite";
import { templateBodyToken, templateHeadToken } from "./config.ts";

type DocumentOptions = {
	isProduction: boolean;
	mainEntry?: ManifestChunk;
	routeEntry?: ManifestChunk;
};

export function document({
	isProduction,
	mainEntry,
	routeEntry,
}: DocumentOptions) {
	// loading here in head (along with the module) mainly to prevent FOUC in dev mode
	const devStyles = isProduction
		? ""
		: `<link rel="stylesheet" href="/src/style.css" />`;

	const devScript = isProduction
		? ""
		: `<script type="module" src="/src/entry-client.tsx"></script>`;

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
  ${templateHeadToken}
  <meta charset="UTF-8" />
  ${devStyles}
  ${globalStyles}
  ${routeStyles}
</head>
<body>
  <div id="app" style="display: contents">${templateBodyToken}</div>
  ${devScript}
  ${globalScript}
  ${routeScript}
</body>
</html>`;
}
