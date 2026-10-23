import test from "node:test";
import assert from "node:assert/strict";
import { computeNewTitle, detectArea, detectKind, hasLabel, hooks, taskCreated } from "../index.js";

test("hooks map registers task.created", () => {
  assert.deepEqual(Object.keys(hooks), ["task.created"]);
  assert.equal(typeof hooks["task.created"], "function");
});

test("prepends inferred area and kind labels", async () => {
  const ops = await taskCreated({
    taskTitle: "Fix crash in login API",
    taskDescription: "The login endpoint returns 500 and crashes.",
  });
  assert.deepEqual(ops, [
    { type: "set_title", value: "[area:backend] [kind:bug] Fix crash in login API" },
  ]);
});

test("no-ops when both labels are already present", async () => {
  const ops = await taskCreated({
    taskTitle: "[area:backend] [kind:bug] Fix crash in login API",
    taskDescription: "endpoint crashes",
  });
  assert.deepEqual(ops, []);
});

test("adds only the missing label", async () => {
  const ops = await taskCreated({
    taskTitle: "[kind:feat] Add dark mode toggle",
    taskDescription: "New button in settings page",
  });
  assert.deepEqual(ops, [
    { type: "set_title", value: "[area:frontend] [kind:feat] Add dark mode toggle" },
  ]);
});

test("no-ops when no keyword matches", async () => {
  const ops = await taskCreated({ taskTitle: "Quarterly planning", taskDescription: "Roadmap discussion" });
  assert.deepEqual(ops, []);
});

test("word boundaries avoid false positives", () => {
  assert.equal(detectKind("Add a prefix to all ids"), "feat");
  assert.equal(detectKind("Prefix the ids"), "");
  assert.equal(detectArea("The page layout"), "frontend");
});

test("hasLabel detects existing prefixes case-insensitively", () => {
  assert.ok(hasLabel("[Area:Docs] Update readme", "area"));
  assert.ok(!hasLabel("Update readme", "area"));
});

test("never throws on missing or malformed events", async () => {
  assert.deepEqual(await taskCreated(undefined), []);
  assert.deepEqual(await taskCreated(null), []);
  assert.deepEqual(await taskCreated({}), []);
  assert.deepEqual(await taskCreated({ taskDescription: "bug in api" }), []);
  assert.equal(computeNewTitle(undefined), "");
});

test("respects the 500 character title limit", async () => {
  const ops = await taskCreated({ taskTitle: "Fix crash " + "x".repeat(500), taskDescription: "bug" });
  assert.deepEqual(ops, []);
});
