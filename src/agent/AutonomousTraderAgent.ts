import { Logger } from "../utils/logger";
import type { DecisionEngine } from "./DecisionEngine";
import type { ExecutionEngine } from "./ExecutionEngine";
import type { IntentScanner } from "./IntentScanner";
import type { NegotiationEngine } from "./NegotiationEngine";
import type { LocalStore } from "../storage/LocalStore";
import type { AgentConfig, Decision, MarketIntent } from "../storage/types";

export interface AgentDependencies {
  config: AgentConfig;
  store: LocalStore;
  scanner: IntentScanner;
  decisionEngine: DecisionEngine;
  negotiationEngine: NegotiationEngine;
  executionEngine: ExecutionEngine;
}

export interface AgentCycleSummary {
  intents: number;
  decisions: number;
  negotiations: number;
  executions: number;
}

export class AutonomousTraderAgent {
  private readonly config: AgentConfig;
  private readonly store: LocalStore;
  private readonly scanner: IntentScanner;
  private readonly decisionEngine: DecisionEngine;
  private readonly negotiationEngine: NegotiationEngine;
  private readonly executionEngine: ExecutionEngine;
  private readonly logger: Logger;
  private timer?: NodeJS.Timeout;

  constructor(deps: AgentDependencies) {
    this.config = deps.config;
    this.store = deps.store;
    this.scanner = deps.scanner;
    this.decisionEngine = deps.decisionEngine;
    this.negotiationEngine = deps.negotiationEngine;
    this.executionEngine = deps.executionEngine;
    this.logger = new Logger((entry) => this.store.saveLog(entry));
  }

  async runOnce(): Promise<AgentCycleSummary> {
    this.logger.info(`Starting autonomous cycle in ${this.config.mode} mode`);
    const intents = await this.scanner.scan();
    this.logger.info(`Discovered ${intents.length} market intents`);
    const decisions = this.decisionEngine.evaluate(intents);
    for (const decision of decisions) {
      this.store.saveDecision(decision);
      this.logger.info(`${decision.action} ${decision.intentId}: ${decision.reason}`);
    }

    let negotiations = 0;
    let executions = 0;
    const intentById = new Map(intents.map((intent) => [intent.id, intent]));

    for (const decision of decisions) {
      const intent = intentById.get(decision.intentId);
      if (!intent || decision.action === "IGNORE") {
        continue;
      }
      if (decision.action === "NEGOTIATE") {
        const result = await this.negotiationEngine.negotiate(intent, decision);
        negotiations += result.inbound ? 2 : 1;
        if (!result.accepted) {
          continue;
        }
      }
      const execution = await this.tryExecute(intent, decision);
      if (execution) {
        executions += 1;
      }
    }

    this.logger.info(`Cycle summary: intents=${intents.length}, decisions=${decisions.length}, negotiations=${negotiations}, executions=${executions}`);
    return { intents: intents.length, decisions: decisions.length, negotiations, executions };
  }

  start(): void {
    if (this.timer) {
      return;
    }
    this.store.setRunning(true);
    void this.runOnceSafely();
    this.timer = setInterval(() => void this.runOnceSafely(), this.config.scanIntervalSeconds * 1000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.store.setRunning(false);
  }

  private async tryExecute(intent: MarketIntent, decision: Decision): Promise<boolean> {
    try {
      const execution = await this.executionEngine.execute(intent, decision);
      this.logger.info(`Execution ${execution.status}: ${execution.txId} (${execution.mode})`);
      return true;
    } catch (error) {
      this.logger.warn(error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  private async runOnceSafely(): Promise<void> {
    try {
      await this.runOnce();
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
