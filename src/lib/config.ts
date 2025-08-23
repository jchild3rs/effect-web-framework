export const isProduction = process.env.NODE_ENV === "production";
export const port = Number.parseInt(process.env.PORT || "5173", 10);
export const base = process.env.BASE || "/";
export const origin = process.env.ORIGIN || `http://localhost:${port}`;
export const routeDir = "src/pages";
export const allowedAPIMethods = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
] as const;
export const templateHeadToken = `<!--app-head-->`;
export const templateBodyToken = `<!--app-body-->`;
