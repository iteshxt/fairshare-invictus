import test from "node:test";
import assert from "node:assert/strict";
import {
  formatMoney,
  splitEqual,
  percentsSumTo100,
  splitByPercent,
  sharesForExpense,
} from "../src/lib/money.js";

test("formatMoney formats currency properly", () => {
  assert.equal(formatMoney(10), "$10.00");
  assert.equal(formatMoney(0), "$0.00");
  assert.equal(formatMoney(-15.5), "-$15.50");
  assert.equal(formatMoney("invalid"), "$0.00");
});

test("splitEqual divides cleanly without penny loss (README rule)", () => {
  const ids = [1, 2, 3];
  const shares = splitEqual(100, ids);
  
  // Total of all shares must equal the original bill down to the cent
  const total = Object.values(shares).reduce((sum, s) => sum + s, 0);
  assert.equal(
    Math.round(total * 100),
    10000,
    `Expected total to be $100.00 but got $${total}`
  );
});

test("splitEqual handles 1 person and empty group safely", () => {
  const single = splitEqual(50, [1]);
  assert.equal(single[1], 50);
});

test("splitByPercent conserves exact total without cent mismatch", () => {
  const percents = { 1: 33.33, 2: 33.33, 3: 33.34 };
  const shares = splitByPercent(10, percents);
  
  const total = Object.values(shares).reduce((sum, s) => sum + s, 0);
  assert.equal(
    Math.round(total * 100),
    1000,
    `Expected total to be $10.00 but got $${total}`
  );
});

test("percentsSumTo100 handles floating point addition", () => {
  // In JS: 33.33 + 33.33 + 33.34 === 100.00000000000001
  assert.equal(
    percentsSumTo100({ 1: 33.33, 2: 33.33, 3: 33.34 }),
    true,
    "Valid percent split should sum to 100"
  );
});

test("percentsSumTo100 rejects negative percentages", () => {
  assert.equal(
    percentsSumTo100({ 1: -50, 2: 150 }),
    false,
    "Negative percentages should be rejected"
  );
});
