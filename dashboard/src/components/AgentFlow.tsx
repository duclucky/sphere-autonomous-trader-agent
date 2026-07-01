export type AgentFlowStepStatus = "idle" | "active" | "complete" | "blocked";

export interface AgentFlowStep {
  label: string;
  status: AgentFlowStepStatus;
  mode: string;
}

interface AgentFlowProps {
  steps: AgentFlowStep[];
}

export function AgentFlow({ steps }: AgentFlowProps) {
  return (
    <div className="agent-flow" aria-label="Backend agent flow">
      {steps.map((step) => (
        <div className={`flow-step ${step.status.toLowerCase()}`} key={step.label}>
          <span className="flow-dot" />
          <span>{step.label}</span>
          <strong>{step.mode}</strong>
        </div>
      ))}
    </div>
  );
}
