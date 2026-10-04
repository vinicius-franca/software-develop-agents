export const phases = [
  "discovery",
  "product_discovery",
  "analysing",
  "architecting",
  "challenging",
  "planning_review",
  "planned",
  "implementing",
  "quality",
  "correcting",
  "product_acceptance",
  "reviewing",
  "blocked",
  "done"
] as const;

export type Phase = (typeof phases)[number];

export interface Evidence {
  id: string;
  type: "test" | "command" | "manual" | "review";
  description: string;
  path?: string;
  createdAt: string;
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  status: "pending" | "passed" | "failed" | "not-proven";
  evidence: Evidence[];
}

export interface TaskState {
  schemaVersion: 1;
  taskId: string;
  title: string;
  phase: Phase;
  revision: number;
  baseline?: string;
  correctionCycles: number;
  acceptanceCriteria: AcceptanceCriterion[];
  product: {
    briefStatus: "pending" | "approved" | "blocked";
    acceptanceStatus: "pending" | "accepted" | "rejected" | "decision-needed";
    sourceRefs: string[];
  };
  nextAction: string;
  updatedAt: string;
}

export interface WorkflowEvent {
  id: string;
  taskId: string;
  from: Phase | null;
  to: Phase;
  actor: string;
  reason: string;
  occurredAt: string;
}
