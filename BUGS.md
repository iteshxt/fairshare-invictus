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

**How to reproduce:**

**What is wrong:**

**What I changed:**

---

