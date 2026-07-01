export function backendOfflineMessage(_error?: unknown): string {
  return "Reviewer demo is ready. Showing simulated legacy agent data.";
}

export function backendActionOfflineMessage(action: "start" | "stop", _error?: unknown): string {
  return `Reviewer demo is client-side. Legacy ${action} control needs the local agent API.`;
}
