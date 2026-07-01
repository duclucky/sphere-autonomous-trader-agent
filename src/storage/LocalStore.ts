import { dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { AgentState, Decision, ExecutionRecord, LogEntry, MarketIntent, NegotiationMessage, WalletIdentity } from "./types";

const emptyState = (): AgentState => ({
  running: false,
  intents: [],
  decisions: [],
  negotiations: [],
  executions: [],
  logs: []
});

export class LocalStore {
  private state: AgentState;
  private readonly filePath: string;
  private readonly memoryOnly: boolean;

  constructor(filePath = "data/agent-state.json") {
    this.filePath = filePath;
    this.memoryOnly = filePath === ":memory:";
    this.state = this.load();
  }

  getState(): AgentState {
    return structuredClone(this.state);
  }

  setRunning(running: boolean): void {
    this.state.running = running;
    this.persist();
  }

  setWallet(wallet: WalletIdentity): void {
    this.state.wallet = wallet;
    this.persist();
  }

  saveIntents(intents: MarketIntent[]): void {
    const known = new Map(this.state.intents.map((intent) => [intent.id, intent]));
    for (const intent of intents) {
      known.set(intent.id, intent);
    }
    this.state.intents = [...known.values()];
    this.persist();
  }

  saveDecision(decision: Decision): void {
    this.state.decisions.push(decision);
    this.persist();
  }

  saveNegotiation(message: NegotiationMessage): void {
    this.state.negotiations.push(message);
    this.persist();
  }

  saveExecution(execution: ExecutionRecord): void {
    this.state.executions.push(execution);
    this.persist();
  }

  saveLog(entry: LogEntry): void {
    this.state.logs.push(entry);
    this.state.logs = this.state.logs.slice(-500);
    this.persist();
  }

  hasExecutionForIntent(intentId: string): boolean {
    return this.state.executions.some((execution) => execution.intentId === intentId && execution.status !== "failed");
  }

  private load(): AgentState {
    if (this.memoryOnly || !existsSync(this.filePath)) {
      return emptyState();
    }
    const raw = readFileSync(this.filePath, "utf8");
    return { ...emptyState(), ...JSON.parse(raw) as AgentState };
  }

  private persist(): void {
    if (this.memoryOnly) {
      return;
    }
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }
}
