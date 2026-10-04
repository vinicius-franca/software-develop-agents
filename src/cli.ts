#!/usr/bin/env node
import { resolve } from "node:path";
import { phases, type Phase } from "./domain.js";
import { appendEvent, createTask, initWorkspace, loadTask, materializeArtifacts, requiredMissing, saveTask } from "./store.js";
import { requiredArtifacts, transition } from "./workflow.js";

const [command, ...args] = process.argv.slice(2);

function usage(): never {
  console.error("Usage: agent-orchestrator <init|new-task|status|validate|transition> ...");
  process.exit(1);
}

async function main(): Promise<void> {
  if (command === "init") {
    const root = resolve(args[0] ?? process.cwd());
    await initWorkspace(root);
    console.log(`Initialized workflow at ${root}`);
    return;
  }
  if (command === "new-task") {
    const [id, title, rootArg] = args;
    if (!id || !title) usage();
    const state = await createTask(resolve(rootArg ?? process.cwd()), id, title);
    console.log(JSON.stringify(state, null, 2));
    return;
  }
  const [id, phaseArg, rootArg] = args;
  if (!id) usage();
  const root = resolve(command === "transition" ? rootArg ?? process.cwd() : phaseArg ?? process.cwd());
  const state = await loadTask(root, id);
  if (command === "status") {
    console.log(JSON.stringify(state, null, 2));
    return;
  }
  if (command === "validate") {
    const missing = await requiredMissing(root, id, requiredArtifacts[state.phase] ?? []);
    console.log(JSON.stringify({ taskId: id, phase: state.phase, valid: missing.length === 0, missing }, null, 2));
    process.exitCode = missing.length ? 2 : 0;
    return;
  }
  if (command === "transition") {
    if (!phaseArg || !phases.includes(phaseArg as Phase)) usage();
    const missing = await requiredMissing(root, id, requiredArtifacts[phaseArg as Phase] ?? []);
    if (missing.length) throw new Error(`Cannot enter ${phaseArg}. Missing artifacts: ${missing.join(", ")}`);
    const next = transition(state, phaseArg as Phase);
    await saveTask(root, next);
    await appendEvent(root, { id: crypto.randomUUID(), taskId: id, from: state.phase, to: next.phase, actor: "orchestrator", reason: `CLI transition requested to ${phaseArg}`, occurredAt: next.updatedAt });
    if (next.phase !== "blocked") await materializeArtifacts(root, id, requiredArtifacts[next.phase] ?? []);
    console.log(JSON.stringify(next, null, 2));
    return;
  }
  usage();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
