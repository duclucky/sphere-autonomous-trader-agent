export function withApiBaseUrl(path: string, apiBaseUrl = import.meta.env.VITE_API_BASE_URL): string {
  const base = apiBaseUrl?.trim().replace(/\/+$/, "");
  if (!base) {
    return path;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
