const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  ""
).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}
