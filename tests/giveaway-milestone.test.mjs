import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { readMilestone } = require(join(process.env.MILESTONE_TEST_BUILD, "model.js"));
const config = { enabled: true, confirmedStickers: 0, updatedOn: "2026-10-17" };

test("no verified count shows a goal without claiming sales", () => {
  const result = readMilestone({ ...config, confirmedStickers: null, updatedOn: null });
  assert.equal(result.confirmedStickers, null);
  assert.equal(result.prizes, 1);
  assert.equal(result.nextGoal, 1_000);
});

test("each thousand adds one complete prize and resets only the displayed progress", () => {
  for (const [total, progress, prizes, remaining, nextGoal] of [
    [0, 0, 1, 1000, 1000], [910, 910, 1, 90, 1000], [999, 999, 1, 1, 1000],
    [1000, 0, 2, 1000, 2000], [1001, 1, 2, 999, 2000], [1350, 350, 2, 650, 2000],
    [2000, 0, 3, 1000, 3000], [10_999, 999, 11, 1, 11_000],
  ]) {
    const result = readMilestone({ ...config, confirmedStickers: total });
    assert.deepEqual([result.confirmedStickers, result.progress, result.prizes, result.remaining, result.nextGoal], [total, progress, prizes, remaining, nextGoal]);
    assert.equal(result.nextPrizes, prizes + 1);
  }
});

test("disabled or malformed settings fail closed without throwing", () => {
  for (const value of [null, undefined, [], {}, { ...config, enabled: false }, { ...config, enabled: "true" }]) {
    assert.equal(readMilestone(value), null);
  }
  for (const total of [-1, 1.5, "910", undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER, {}]) {
    assert.equal(readMilestone({ ...config, confirmedStickers: total }), null);
  }
});

test("a published count needs a real date, including leap year checks", () => {
  for (const updatedOn of [null, "", "2026-02-29", "2026-04-31", "2026-13-01", "17/10/2026", "2026-10-17T12:00:00Z"]) {
    assert.equal(readMilestone({ ...config, updatedOn }), null);
  }
  assert.equal(readMilestone({ ...config, updatedOn: "2028-02-29" }).updatedOn, "2028-02-29");
});
