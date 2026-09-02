# Bugs found

Add one section per issue. Bug 1 is filled in to show the format — fix it, then write what you changed. Copy the blank template for the rest.

Keep this file in the repo and **commit it** with your fixes.

---

## Bug 1

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is showing oldest expenses first. Newest should be at the top.

**What I changed:**
- In `src/components/ExpenseList.jsx`, reversed the sort comparator from `dateValue(a.date) - dateValue(b.date)` (ascending / oldest first) to `dateValue(b.date) - dateValue(a.date)` (descending / newest first).
- In `src/lib/format.js`, updated `dateValue` to safely parse both `Date` objects and date strings (such as those hydrated from `localStorage`) to numeric timestamps via `Date.parse()` or `.getTime()`, avoiding `NaN` during date comparisons.

---

## Bug 2

**How to reproduce:** Filter expenses by category "Food", then click "Delete" on the row for "Coffee" (at row index 2 of the filtered list). Clear the filter: Coffee is still there, but Airbnb deposit (which occupied index 2 of the unfiltered array) was deleted.

**What is wrong:** `ExpenseList.jsx` passed the visual loop index of the filtered/sorted array to `onDeleteAt(index)` and `onUpdateAt(index)`. `App.jsx` dispatched these directly to `store.js`, which performed an array splice `state.expenses.splice(action.index, 1)`. When the list is filtered or sorted, the visual index does not match the item's index in `state.expenses`, causing operations to mutate or delete completely wrong expenses. Additionally, `ExpenseList.jsx` used `key={index}`, which caused React DOM recycling bugs with row-level draft amount state.

**What I changed:**
- Refactored `DELETE_EXPENSE` and `UPDATE_EXPENSE` in `src/state/store.js` to target expenses by their unique, immutable `id` (`action.id`) using `.filter()` and `.map()`.
- Updated `src/App.jsx` to pass `onDelete={(id) => dispatch({ type: "DELETE_EXPENSE", id })}` and `onUpdate={(id, patch) => dispatch({ type: "UPDATE_EXPENSE", id, patch })}`.
- Updated `src/components/ExpenseList.jsx` to use `key={expense.id}` and pass `expense.id` to `onDelete` and `onSaveAmount`.
- Added a `useEffect` hook in `ExpenseRow` to ensure draft amount state updates if `expense.amount` changes externally.

---

## Bug 3

**How to reproduce:** Add an expense of $100.00 split equally among 3 people, or an expense of $10.00 split 33.33%, 33.33%, 33.34%. In both cases, the calculated shares sum to $99.99 and $9.99 respectively, losing $0.01. Furthermore, entering percentage splits like -50% and 150% is erroneously accepted because only the sum was checked.

**What is wrong:** `splitEqual` and `splitByPercent` in `src/lib/money.js` rounded each individual participant's share independently using `.toFixed(2)`. The sum of truncated shares drifted away from the original bill amount, violating the core requirement: *"Those portions together should make up the full bill — the group should not 'lose' or 'invent' money in the rounding."* Additionally, `percentsSumTo100` evaluated strict equality (`=== 100`) without floating-point tolerance, and allowed negative percentages.

**What I changed:**
- In `src/lib/money.js`, refactored `splitEqual` to compute integer cents (`totalCents = Math.round(amount * 100)`), assign `base = Math.floor(totalCents / n)`, and distribute remainder cents (`totalCents % n`) across shares so `sum(shares) === amount` exactly to the cent.
- In `splitByPercent`, allocated integer cents per percentage and assigned the residual balance to the final share, ensuring exact-cent conservation.
- In `percentsSumTo100`, validated that every percentage value is a finite number between 0 and 100, and verified the sum equals 100 within floating-point tolerance (`Math.abs(sum - 100) < 0.01`).

---

## Bug 4

**How to reproduce:** Inspect the seeded expense "Uber to airport" ($60 paid by Diya, split between Aisha and Ben). Diya did not ride in the cab and was omitted from the split. In the balances, Diya is credited only +$30 instead of her full +$60. Summing all balances yields -$30.00 instead of $0.00, meaning money was destroyed.

**What is wrong:** In `src/lib/balances.js`, an unnecessary check `if (!(exp.paidBy in shares) && !(String(exp.paidBy) in shares))` deducted `Number(exp.amount) / n` from the payer's balance whenever they were not included in `splitWith`. This directly contradicted the specification in README.md ("Paying for other people... They should get that fare back in full... Closed group, not a bank") and violated the fundamental accounting invariant that the sum of all net positions across the closed group must equal zero.

**What I changed:**
- In `src/lib/balances.js`, deleted lines 16–19 that deducted a share from non-participating payers. The payer is now credited the full payment, and only participants listed in `shares` are charged their respective shares.
- Added rounding to 2 decimal places for all final balance figures (`Math.round(bal[id] * 100) / 100`) to eliminate floating-point representation artifacts.

---

## Bug 5

**How to reproduce:**

**What is wrong:**

**What I changed:**

---


