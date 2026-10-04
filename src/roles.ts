export type RoleId =
  | "orchestrator"
  | "product-owner"
  | "analyst"
  | "architect"
  | "red-team"
  | "planning-council"
  | "engineer"
  | "qa"
  | "reviewer";

export interface RoleProfile {
  id: RoleId;
  writesProduction: boolean;
  writesTests: boolean;
  requiredArtifacts: string[];
}

export const roles: Record<RoleId, RoleProfile> = {
  orchestrator: { id: "orchestrator", writesProduction: false, writesTests: false, requiredArtifacts: ["state.json"] },
  "product-owner": { id: "product-owner", writesProduction: false, writesTests: false, requiredArtifacts: ["product-brief.md", "product-acceptance.md"] },
  analyst: { id: "analyst", writesProduction: false, writesTests: false, requiredArtifacts: ["spec.md"] },
  architect: { id: "architect", writesProduction: false, writesTests: false, requiredArtifacts: ["architecture.md", "plan.md"] },
  "red-team": { id: "red-team", writesProduction: false, writesTests: false, requiredArtifacts: ["challenge.md"] },
  "planning-council": { id: "planning-council", writesProduction: false, writesTests: false, requiredArtifacts: ["planning-decision.md"] },
  engineer: { id: "engineer", writesProduction: true, writesTests: true, requiredArtifacts: [] },
  qa: { id: "qa", writesProduction: false, writesTests: true, requiredArtifacts: ["qa-plan.md", "validation.md"] },
  reviewer: { id: "reviewer", writesProduction: false, writesTests: false, requiredArtifacts: ["review.md"] }
};
