export function formatDateTime(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
