import type { Phase, TaskState } from "./domain.js";

const transitions: Record<Phase, Phase[]> = {
  discovery: ["product_discovery", "blocked"],
  product_discovery: ["analysing", "blocked"],
  analysing: ["architecting", "blocked"],
  architecting: ["challenging", "blocked"],
  challenging: ["planning_review", "blocked"],
  planning_review: ["planned", "blocked"],
  planned: ["implementing", "blocked"],
  implementing: ["quality", "blocked"],
  quality: ["correcting", "product_acceptance", "blocked"],
  correcting: ["implementing", "blocked"],
  product_acceptance: ["reviewing", "correcting", "blocked"],
  reviewing: ["done", "correcting", "blocked"],
  blocked: ["product_discovery", "analysing", "architecting", "planning_review", "implementing", "quality", "product_acceptance", "reviewing"],
  done: []
};

export const requiredArtifacts: Partial<Record<Phase, string[]>> = {
  analysing: ["product-brief.md"],
  architecting: ["product-brief.md", "spec.md"],
  challenging: ["product-brief.md", "spec.md", "architecture.md", "plan.md"],
  planning_review: ["product-brief.md", "spec.md", "architecture.md", "plan.md", "challenge.md"],
  planned: ["product-brief.md", "spec.md", "architecture.md", "plan.md", "challenge.md", "planning-decision.md"],
  implementing: ["product-brief.md", "spec.md", "architecture.md", "plan.md", "challenge.md", "planning-decision.md"],
  product_acceptance: ["qa-plan.md", "validation.md"],
  reviewing: ["qa-plan.md", "validation.md", "product-acceptance.md"],
  done: ["qa-plan.md", "validation.md", "product-acceptance.md", "review.md"]
};

export function canTransition(from: Phase, to: Phase): boolean {
  return transitions[from].includes(to);
}

export function transition(state: TaskState, to: Phase): TaskState {
  if (!canTransition(state.phase, to)) {
    throw new Error(`Transition from ${state.phase} to ${to} is not allowed.`);
  }
  const correctionCycles = to === "correcting" ? state.correctionCycles + 1 : state.correctionCycles;
  if (correctionCycles > 2) {
    return { ...state, phase: "blocked", correctionCycles, nextAction: "Human decision required: correction-cycle limit exceeded.", updatedAt: new Date().toISOString() };
  }
  return { ...state, phase: to, correctionCycles, nextAction: `Complete the ${to} gate.`, updatedAt: new Date().toISOString() };
}
