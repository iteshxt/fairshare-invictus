import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, dateValue } from "../src/lib/format.js";

test("formatDate formats Date objects and ISO strings correctly", () => {
  const d = new Date("2026-03-12T00:00:00");
  const formatted = formatDate(d);
  assert.equal(typeof formatted, "string");
  assert.equal(formatted.includes("2026"), true);
});

test("dateValue converts dates and date strings to numeric timestamp for safe sorting", () => {
  const d1 = new Date("2026-03-07");
  const d2 = "2026-03-15";

  const val1 = dateValue(d1);
  const val2 = dateValue(d2);

  // Both should be valid numeric timestamps
  assert.equal(Number.isFinite(Number(val1)), true, "Date object should have numeric value");
  assert.equal(Number.isFinite(Number(val2)), true, "String date should have numeric value");

  // Descending sort check: 15 Mar > 7 Mar
  assert.equal(Number(val2) > Number(val1), true, "Newer date has higher timestamp");
});
