import type { RoleId } from "./roles.js";
import type { TaskState } from "./domain.js";

export type RunnableRole = Extract<RoleId, "product-owner" | "analyst">;

export interface AgentRunRequest {
  role: RunnableRole;
  task: TaskState;
  artifacts: Record<string, string>;
  instructions: string;
}

export interface AgentRunResult {
  artifactName: "product-brief.md" | "spec.md";
  artifactMarkdown: string;
  model: string;
  requestId?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  rawOutput?: unknown;
}

export interface AgentRuntime {
  readonly name: string;
  run(request: AgentRunRequest): Promise<AgentRunResult>;
}

export class MockAgentRuntime implements AgentRuntime {
  readonly name = "mock";

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    if (request.role === "product-owner") {
      return {
        artifactName: "product-brief.md",
        artifactMarkdown: `# Product brief\n\n## Sources\n\n- Mock source: ${request.task.title}\n\n## Problem and expected value\n\nDefine the expected product outcome for ${request.task.title}.\n\n## Priority and constraints\n\n- Priority: to be confirmed\n- Constraints: none supplied\n\n## Product criteria\n\n- The requested outcome is demonstrably delivered.\n\n## Open questions\n\n- Which source of truth confirms the priority?\n`,
        model: "mock-agent-runtime"
      };
    }

    return {
      artifactName: "spec.md",
      artifactMarkdown: `# Specification\n\n## Scope\n\nDefine the minimum deliverable for ${request.task.title}.\n\n## Acceptance criteria\n\n- AC-01: The product criterion can be verified.\n\n## Scenarios\n\n- Given an approved product brief, when the work is implemented, then AC-01 is proven.\n\n## Assumptions and risks\n\n- Assumption: the product brief is complete.\n`,
      model: "mock-agent-runtime"
    };
  }
}
