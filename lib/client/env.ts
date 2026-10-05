/**
 * Client-safe environment helpers. Only NEXT_PUBLIC_* values are read here.
 *
 * STATIC_PREVIEW mode exists for the sandbox preview build (static export served from object
 * storage, API proxied to a separate Next server). On Vercel both flags are unset and the app
 * behaves like a normal Next.js application with relative API calls and client-side routing.
 */
export const STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1";

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
/** Placeholder such as `__PORT_3000__` is rewritten by the preview deployer; if it survives, fall back to same-origin. */
export const API_BASE = rawApiBase.startsWith("__") ? "" : rawApiBase.replace(/\/+$/, "");

export function apiUrl(path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${clean}` : clean;
}

/** Build an in-app URL. Static preview uses flat `page.html?query` files. */
export function href(path: string, query?: Record<string, string | undefined>) {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join("&")
    : "";
  const suffix = qs ? `?${qs}` : "";
  if (STATIC_PREVIEW) {
    const file = path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`;
    return `${file}${suffix}`;
  }
  return `${path}${suffix}`;
}
