export function toneColor(tone: "ok" | "warn" | "fail" | "muted") {
  if (tone === "ok") return "var(--success)";
  if (tone === "warn") return "var(--accent)";
  if (tone === "fail") return "var(--danger)";
  return "var(--muted)";
}
