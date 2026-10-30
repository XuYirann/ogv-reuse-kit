/** Report edition sets chart defaults; preview keeps the latest data. */
export function reportPeriod() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const period = params.get("conclusion");
  return !params.has("preview") && period && /^\d{2}Q[1-4]$/.test(period) ? period : null;
}

export function reportEndPeriod(periods: string[], monthly = false) {
  const report = reportPeriod();
  const cutoff = report && (monthly ? `20${report.slice(0, 2)}-${String(Number(report.at(-1)) * 3).padStart(2, "0")}` : report);
  return (cutoff ? periods.filter(period => period <= cutoff).at(-1) : periods.at(-1)) ?? periods[0];
}
