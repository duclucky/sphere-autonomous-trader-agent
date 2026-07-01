export function isResolvableCounterparty(counterparty: string): boolean {
  const value = counterparty.trim();
  if (!value || value === "unknown-counterparty") {
    return false;
  }
  if (value.startsWith("@") || value.startsWith("DIRECT://") || value.startsWith("PROXY://")) {
    return true;
  }
  return /^(02|03)[0-9a-fA-F]{64}$/.test(value) || /^[0-9a-fA-F]{64}$/.test(value);
}

export function normalizeMarketCounterparty(contactHandle?: string, agentNametag?: string): string {
  const contact = contactHandle?.trim();
  if (contact) {
    return contact;
  }
  const nametag = agentNametag?.trim();
  if (nametag) {
    return nametag.startsWith("@") ? nametag : `@${nametag}`;
  }
  return "unknown-counterparty";
}
