import assert from "node:assert/strict";
import test from "node:test";

const { stepPercent } = await import("../src/lib/domain/percent.ts");

test("incrementa e reduz percentuais sem usar o controle numérico nativo", () => {
  assert.equal(stepPercent("", 0.1), "0,1");
  assert.equal(stepPercent("30", 0.1), "30,1");
  assert.equal(stepPercent("0", -0.1), "0");
});
