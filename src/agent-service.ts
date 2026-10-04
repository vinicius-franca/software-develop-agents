import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentRuntime, RunnableRole } from "./agent-runtime.js";
import { loadTask, taskPath } from "./store.js";

const roleConfiguration: Record<RunnableRole, {
  phase: "product_discovery" | "analysing";
  artifact: "product-brief.md" | "spec.md";
  instructions: string;
  contextArtifacts: string[];
}> = {
  "product-owner": {
    phase: "product_discovery",
    artifact: "product-brief.md",
    instructions: "Act as the mandatory Product Owner Agent. Produce a traceable product brief. When source information is missing or conflicting, record an explicit open question instead of inventing a business decision.",
    contextArtifacts: []
  },
  analyst: {
    phase: "analysing",
    artifact: "spec.md",
    instructions: "Act as the Analyst. Transform the approved product brief into a testable specification with scope, acceptance criteria, scenarios, assumptions and risks. Do not add product decisions that are unsupported by the brief.",
    contextArtifacts: ["product-brief.md"]
  }
};

export interface AgentExecutionRecord {
  executionId: string;
  taskId: string;
  role: RunnableRole;
  runtime: string;
  model: string;
  artifactName: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  requestId?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export async function runAgent(root: string, taskId: string, role: RunnableRole, runtime: AgentRuntime): Promise<AgentExecutionRecord> {
  const task = await loadTask(root, taskId);
  const config = roleConfiguration[role];
  if (task.phase !== config.phase) {
    throw new Error(`${role} can run only in ${config.phase}; task ${taskId} is in ${task.phase}.`);
  }
  const directory = taskPath(root, taskId);
  const artifacts: Record<string, string> = {};
  for (const name of config.contextArtifacts) artifacts[name] = await readFile(join(directory, name), "utf8");
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const result = await runtime.run({ role, task, artifacts, instructions: config.instructions });
  if (result.artifactName !== config.artifact) throw new Error(`${role} attempted to write ${result.artifactName}; expected ${config.artifact}.`);
  await writeFile(join(directory, result.artifactName), result.artifactMarkdown, "utf8");
  const completedAt = new Date().toISOString();
  const record: AgentExecutionRecord = {
    executionId: crypto.randomUUID(), taskId, role, runtime: runtime.name, model: result.model,
    artifactName: result.artifactName, startedAt, completedAt, durationMs: Date.now() - started,
    requestId: result.requestId, usage: result.usage
  };
  const runDirectory = join(directory, "runs");
  await mkdir(runDirectory, { recursive: true });
  await writeFile(join(runDirectory, `${record.executionId}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}
