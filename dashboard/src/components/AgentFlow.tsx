import type { ReviewerStep } from "../reviewerDemo/runner";

interface AgentFlowProps {
  steps: ReviewerStep[];
}

export function AgentFlow({ steps }: AgentFlowProps) {
  return (
    <div className="agent-flow" aria-label="Reviewer demo flow">
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
