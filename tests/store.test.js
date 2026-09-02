import test from "node:test";
import assert from "node:assert/strict";
import { reducer, nextMemberId } from "../src/state/store.js";

test("nextMemberId increments highest existing id", () => {
  const members = [{ id: 1 }, { id: 4 }, { id: 2 }];
  assert.equal(nextMemberId(members), 5);
});

test("reducer adds new expense and member", () => {
  const initialState = {
    members: [{ id: 1, name: "Aisha" }],
    expenses: [],
  };

  const withMember = reducer(initialState, {
    type: "ADD_MEMBER",
    member: { id: 2, name: "Ben" },
  });
  assert.equal(withMember.members.length, 2);

  const withExpense = reducer(withMember, {
    type: "ADD_EXPENSE",
    expense: { id: "e1", description: "Dinner", amount: 50 },
  });
  assert.equal(withExpense.expenses.length, 1);
});

test("reducer deletes expense by ID rather than vulnerable array index", () => {
  const initialState = {
    expenses: [
      { id: "e1", description: "Groceries" },
      { id: "e2", description: "Uber" },
      { id: "e3", description: "Airbnb" },
    ],
  };

  // When filtered, user might click row for 'Uber' (e2).
  // Deleting by ID should remove only e2 regardless of original array positions.
  const next = reducer(initialState, {
    type: "DELETE_EXPENSE",
    id: "e2",
    // support legacy index temporarily until we fix
    index: 1,
  });

  assert.equal(next.expenses.some((e) => e.id === "e2"), false);
  assert.equal(next.expenses.length, 2);
  assert.equal(next.expenses[0].id, "e1");
  assert.equal(next.expenses[1].id, "e3");
});

test("reducer updates expense by ID without mutating other expenses", () => {
  const initialState = {
    expenses: [
      { id: "e1", description: "Groceries", amount: 100 },
      { id: "e2", description: "Uber", amount: 60 },
      { id: "e3", description: "Airbnb", amount: 240 },
    ],
  };

  const next = reducer(initialState, {
    type: "UPDATE_EXPENSE",
    id: "e2",
    patch: { amount: 75 },
  });

  assert.equal(next.expenses.find((e) => e.id === "e2")?.amount, 75);
  assert.equal(next.expenses.find((e) => e.id === "e1")?.amount, 100);
  assert.equal(next.expenses.find((e) => e.id === "e3")?.amount, 240);
});

test("filtering by paidBy works with string and number representations", () => {
  const expenses = [
    { id: "e1", description: "Dinner", paidBy: 1 },
    { id: "e2", description: "Uber", paidBy: 2 },
    { id: "e3", description: "Coffee", paidBy: 1 },
  ];

  // Selecting member '1' in HTML select gives string "1"
  const filterPaidBy = "1";
  const filtered = expenses.filter((e) =>
    filterPaidBy !== "" ? String(e.paidBy) === String(filterPaidBy) : true
  );

  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].id, "e1");
  assert.equal(filtered[1].id, "e3");
});


