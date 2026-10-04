import assert from "node:assert/strict";
import test from "node:test";
import type { TaskState } from "./domain.js";
import { canTransition, transition } from "./workflow.js";

function task(phase: TaskState["phase"], correctionCycles = 0): TaskState {
  return {
    schemaVersion: 1, taskId: "ORQ-1", title: "Test", phase, revision: 1, correctionCycles,
    acceptanceCriteria: [], product: { briefStatus: "pending", acceptanceStatus: "pending", sourceRefs: [] },
    nextAction: "", updatedAt: "2026-01-01T00:00:00.000Z"
  };
}

test("requires Product Owner before analysis", () => {
  assert.equal(canTransition("discovery", "analysing"), false);
  assert.equal(canTransition("product_discovery", "analysing"), true);
});

test("rejects skipped planning phases", () => {
  assert.throws(() => transition(task("analysing"), "implementing"));
});

test("QA may request correction", () => {
  const result = transition(task("quality"), "correcting");
  assert.equal(result.phase, "correcting");
  assert.equal(result.correctionCycles, 1);
});

test("third correction blocks the task", () => {
  const result = transition(task("quality", 2), "correcting");
  assert.equal(result.phase, "blocked");
});

test("done has no outgoing transition", () => {
  assert.equal(canTransition("done", "reviewing"), false);
});
