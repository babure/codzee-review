/** Allow only same-origin relative paths (blocks open redirects). */
export function safeInternalPath(target: string, fallback = "/dashboard"): string {
  if (!target) {
    return fallback;
  }
  if (!target.startsWith("/")) {
    return fallback;
  }
  if (target.startsWith("//") || target.startsWith("/\\")) {
    return fallback;
  }
  if (target.includes("://")) {
    return fallback;
  }
  return target;
}
