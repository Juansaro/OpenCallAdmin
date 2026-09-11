import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeMetrics } from "./metrics.ts";
import { createSeed } from "./seed.ts";

describe("computeMetrics", () => {
  it("cuenta tickets abiertos y escalados del seed", () => {
    const metrics = computeMetrics(createSeed());
    assert.equal(metrics.ticketsOpen, 3);
    assert.equal(metrics.ticketsEscalated, 1);
    assert.equal(metrics.l2ResolutionRate, 100);
    assert.ok((metrics.callsToday ?? 0) >= 1);
  });
});
