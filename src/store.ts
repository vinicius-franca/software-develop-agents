import { mkdir, readFile, writeFile, appendFile, access, cp } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import type { TaskState, WorkflowEvent } from "./domain.js";
import { templates } from "./templates.js";

export function workflowRoot(root: string): string {
  return join(root, "docs", "agent-workflow", "tasks");
}

export function taskPath(root: string, id: string): string {
  return join(workflowRoot(root), id);
}

export async function exists(path: string): Promise<boolean> {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

export async function initWorkspace(root: string): Promise<void> {
  await mkdir(workflowRoot(root), { recursive: true });
  await mkdir(join(root, "docs", "agent-workflow", "templates"), { recursive: true });
  for (const [name, content] of Object.entries(templates)) {
    await writeFile(join(root, "docs", "agent-workflow", "templates", name), content, "utf8");
  }
}

export async function createTask(root: string, id: string, title: string): Promise<TaskState> {
  const path = taskPath(root, id);
  if (await exists(path)) throw new Error(`Task ${id} already exists.`);
  await mkdir(path, { recursive: true });
  const now = new Date().toISOString();
  const state: TaskState = {
    schemaVersion: 1, taskId: id, title, phase: "product_discovery", revision: 1,
    correctionCycles: 0, acceptanceCriteria: [],
    product: { briefStatus: "pending", acceptanceStatus: "pending", sourceRefs: [] },
    nextAction: "Product Owner Agent: create product-brief.md from traceable sources.", updatedAt: now
  };
  await saveTask(root, state);
  await writeFile(join(path, "product-brief.md"), templates["product-brief.md"], "utf8");
  await appendEvent(root, { id: crypto.randomUUID(), taskId: id, from: null, to: state.phase, actor: "orchestrator", reason: "Task created", occurredAt: now });
  return state;
}

export async function loadTask(root: string, id: string): Promise<TaskState> {
  return JSON.parse(await readFile(join(taskPath(root, id), "state.json"), "utf8")) as TaskState;
}

export async function saveTask(root: string, state: TaskState): Promise<void> {
  const path = taskPath(root, state.taskId);
  await writeFile(join(path, "state.json"), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function appendEvent(root: string, event: WorkflowEvent): Promise<void> {
  await appendFile(join(taskPath(root, event.taskId), "events.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
}

export async function requiredMissing(root: string, id: string, required: string[]): Promise<string[]> {
  const base = taskPath(root, id);
  const missing: string[] = [];
  for (const artifact of required) if (!(await exists(join(base, artifact)))) missing.push(artifact);
  return missing;
}

export async function materializeArtifacts(root: string, id: string, names: string[]): Promise<void> {
  const path = taskPath(root, id);
  for (const name of names) {
    const target = join(path, name);
    if (!(await exists(target)) && templates[name]) await writeFile(target, templates[name], "utf8");
  }
}
