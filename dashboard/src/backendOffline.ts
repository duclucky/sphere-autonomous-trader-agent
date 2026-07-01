export function backendOfflineMessage(_error?: unknown): string {
  return "Backend offline. Showing demo data.";
}

export function backendActionOfflineMessage(action: "start" | "stop", _error?: unknown): string {
  return `Backend offline. Cannot ${action} agent from static preview.`;
}
