import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockAgentRuntime } from "./agent-runtime.js";
import { runAgent } from "./agent-service.js";
import { createTask, initWorkspace, loadTask, saveTask, taskPath } from "./store.js";

async function workspace(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-orchestrator-"));
}

test("Product Owner writes its artifact and records the run without moving state", async () => {
  const root = await workspace();
  try {
    await initWorkspace(root);
    await createTask(root, "ORQ-7", "Integrate an LLM runtime");
    const record = await runAgent(root, "ORQ-7", "product-owner", new MockAgentRuntime());
    assert.equal(record.artifactName, "product-brief.md");
    assert.equal((await loadTask(root, "ORQ-7")).phase, "product_discovery");
    assert.match(await readFile(join(taskPath(root, "ORQ-7"), "product-brief.md"), "utf8"), /Mock source/);
    assert.match(await readFile(join(taskPath(root, "ORQ-7"), "runs", `${record.executionId}.json`), "utf8"), /mock-agent-runtime/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("Analyst requires the analysing phase and receives the product brief", async () => {
  const root = await workspace();
  try {
    await initWorkspace(root);
    const task = await createTask(root, "ORQ-8", "Write a specification");
    await assert.rejects(() => runAgent(root, "ORQ-8", "analyst", new MockAgentRuntime()), /only in analysing/);
    await saveTask(root, { ...task, phase: "analysing" });
    await runAgent(root, "ORQ-8", "analyst", new MockAgentRuntime());
    assert.match(await readFile(join(taskPath(root, "ORQ-8"), "spec.md"), "utf8"), /Acceptance criteria/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
