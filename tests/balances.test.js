import test from "node:test";
import assert from "node:assert/strict";
import { computeBalances, totalSpent } from "../src/lib/balances.js";

test("totalSpent sums all expense amounts correctly", () => {
  const expenses = [{ amount: 10 }, { amount: 25.5 }, { amount: 14.5 }];
  assert.equal(totalSpent(expenses), 50);
});

test("computeBalances credits payer 100% when payer is NOT in the split", () => {
  const members = [
    { id: 1, name: "Aisha" },
    { id: 2, name: "Ben" },
    { id: 3, name: "Diya" },
  ];
  // Diya (3) pays $60 for Aisha (1) and Ben (2)
  const expenses = [
    {
      id: "e1",
      amount: 60,
      paidBy: 3,
      splitType: "equal",
      splitWith: [1, 2],
    },
  ];

  const balances = computeBalances(members, expenses);

  // Diya should be credited $60 in full
  assert.equal(balances[3], 60, "Payer not in split should be credited full amount");
  // Aisha and Ben should each owe $30
  assert.equal(balances[1], -30, "Participant 1 owes $30");
  assert.equal(balances[2], -30, "Participant 2 owes $30");

  // Balance sum invariant: total across group must sum to 0
  const sum = Object.values(balances).reduce((a, b) => a + b, 0);
  assert.equal(Math.round(sum * 100) / 100, 0, "Sum of all balances must be 0");
});

test("computeBalances closed-group invariant: sum of balances must always equal zero", () => {
  const members = [
    { id: 1, name: "Aisha" },
    { id: 2, name: "Ben" },
    { id: 3, name: "Carlos" },
    { id: 4, name: "Diya" },
  ];
  const expenses = [
    { id: "e1", amount: 100, paidBy: 1, splitType: "equal", splitWith: [1, 2, 3] },
    { id: "e2", amount: 60, paidBy: 4, splitType: "equal", splitWith: [1, 2] },
    { id: "e3", amount: 240, paidBy: 2, splitType: "equal", splitWith: [1, 2, 3] },
  ];

  const balances = computeBalances(members, expenses);
  const sum = Object.values(balances).reduce((a, b) => a + b, 0);
  assert.equal(Math.abs(sum) < 0.001, true, `Sum of balances was ${sum}, expected ~0`);
});
