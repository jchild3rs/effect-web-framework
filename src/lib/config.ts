export const isProduction = process.env.NODE_ENV === "production";
export const port = Number(process.env.PORT || "5173");
export const base = process.env.BASE || "/";
export const origin = process.env.ORIGIN || `http://localhost:${port}`;
export const routeDir = "src/pages";
export const allowAPIMethods = [
	"GET",
	"POST",
	"DELETE",
	"PUT",
	"PATCH",
] as const;
