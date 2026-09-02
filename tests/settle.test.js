import test from "node:test";
import assert from "node:assert/strict";
import { suggestSettlements } from "../src/lib/settle.js";

test("suggestSettlements creates transfer when debtor amount equals creditor amount", () => {
  const members = [
    { id: 1, name: "Aisha" },
    { id: 2, name: "Ben" },
  ];
  // Aisha owes $50, Ben is owed $50
  const balances = {
    1: -50,
    2: 50,
  };

  const transfers = suggestSettlements(balances, members);

  assert.equal(transfers.length, 1, "Should generate exactly 1 settlement transfer");
  assert.equal(transfers[0].from, 1);
  assert.equal(transfers[0].to, 2);
  assert.equal(transfers[0].amount, 50);
});

test("suggestSettlements resolves multi-party debts completely", () => {
  const members = [
    { id: 1, name: "Aisha" },
    { id: 2, name: "Ben" },
    { id: 3, name: "Carlos" },
  ];
  // Aisha is owed 60, Ben owes 40, Carlos owes 20
  const balances = {
    1: 60,
    2: -40,
    3: -20,
  };

  const transfers = suggestSettlements(balances, members);

  // Total transferred should equal total debt (60)
  const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);
  assert.equal(totalTransferred, 60);

  // Check each transfer direction
  for (const t of transfers) {
    assert.equal(t.to, 1, "Transfers should go to creditor Aisha");
  }
});
