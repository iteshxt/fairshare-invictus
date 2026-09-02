# Changes Log (`changes.md`)

This file tracks all modifications, bug fixes, enhancements, and file diffs made across the project systematically.

---

## Workflow Rules
1. **Audit & Test First**: Every bug is verified with an automated test in `tests/`.
2. **Review Before Modify**: Exact code changes are explained and approved before applying.
3. **Formal Verification**: Automated test run results confirmed.
4. **Commit Gate**: Professional commit message presented in chat; committed only upon explicit approval.
5. **Continuous Documentation**: Both `BUGS.md` and `changes.md` updated per fix.

---

## Change Log Entries

### Phase 0: Test Harness & Git Initialization
- **Scope**:
  - Reinitialized Git repository.
  - Added `"test": "node --test tests/*.test.js"` script to `package.json`.
  - Created automated test suite in `tests/`:
    - `tests/money.test.js`
    - `tests/balances.test.js`
    - `tests/settle.test.js`
    - `tests/format.test.js`
    - `tests/store.test.js`
  - Created documentation trackers `agent-chat.md` and `changes.md`.
- **Test Verification**:
  - Ran `npm test`. Executed 16 tests: 8 passed and 8 failed, successfully establishing clear regression detection for all audited core invariants and bugs.
- **Commit**: `5828b39` - `test: add automated unit test suite for core invariants and edge cases`
- **Status**: Committed.

---

### Bug 1: Expense List Sort Order Inverted
- **Affected Files**:
  - `src/components/ExpenseList.jsx`
  - `src/lib/format.js`
  - `BUGS.md`
- **Issue Description**: The expense list claimed "Newest first", but displayed the oldest expenses at the top.
- **Root Cause**: Comparator used `dateValue(a.date) - dateValue(b.date)` (ascending) rather than descending, and `dateValue` returned raw strings on localStorage loads.
- **Fix Details**:
  - Updated `ExpenseList.jsx` to sort descending: `(a, b) => dateValue(b.date) - dateValue(a.date)`.
  - Updated `format.js` `dateValue` to reliably return numeric millisecond timestamps for both `Date` objects and string dates.
- **Tests Added/Updated**: `tests/format.test.js` passed.
- **Commit**: `eb961ec` - `fix: order expenses newest first and parse numeric timestamps in dateValue`
- **Status**: Committed.

---

### Bug 2: Filtered/Sorted Mutations Target Wrong Expense by Index
- **Affected Files**:
  - `src/state/store.js`
  - `src/App.jsx`
  - `src/components/ExpenseList.jsx`
  - `tests/store.test.js`
  - `BUGS.md`
- **Issue Description**: Deleting or editing an expense when the list is filtered or sorted operates on a completely different expense.
- **Root Cause**: Mutations operated by array index in `state.expenses` rather than stable `expense.id`.
- **Fix Details**:
  - Refactored `DELETE_EXPENSE` and `UPDATE_EXPENSE` in `store.js` to mutate by `action.id`.
  - Updated `App.jsx` to dispatch `DELETE_EXPENSE` and `UPDATE_EXPENSE` with `id`.
  - Updated `ExpenseList.jsx` to pass `expense.id` to delete/update handlers and use `key={expense.id}`.
  - Added `useEffect` in `ExpenseRow` to sync draft amounts when `expense.amount` changes externally.
- **Tests Added/Updated**: Added unit tests in `tests/store.test.js` for ID-based delete and update mutations.
- **Commit**: `788778f` - `fix: mutate expenses by stable id and bind React keys to expense id`
- **Status**: Committed.

---

### Bug 3: Equal and Percentage Splits Lose/Invent Pennies & Floating-Point Validation
- **Affected Files**:
  - `src/lib/money.js`
  - `BUGS.md`
- **Issue Description**: Equal and custom percentage splits lose or invent pennies due to independent truncation, and invalid/negative percentage splits are accepted.
- **Root Cause**: Shares were rounded independently using `.toFixed(2)` without allocating remainder cents, and `percentsSumTo100` did not validate ranges or floating-point sums.
- **Fix Details**:
  - Refactored `splitEqual` to allocate integer cents with remainder distribution so `sum(shares) === amount` down to the cent.
  - Refactored `splitByPercent` to allocate integer cents and absorb residual cents in the final participant's share.
  - Hardened `percentsSumTo100` to reject negative/non-finite percentages and check `Math.abs(sum - 100) < 0.01`.
- **Tests Added/Updated**: `tests/money.test.js` all 5 tests passing.
- **Commit**: `fbf5d14` - `fix: preserve exact split totals without penny loss and validate percentages`
- **Status**: Committed.

---

### Bug 4: Non-Participating Payer Overcharged in computeBalances
- **Affected Files**:
  - `src/lib/balances.js`
  - `BUGS.md`
- **Issue Description**: Payers not included in the split are charged an extra share, breaking the zero-sum balance invariant across the closed group.
- **Root Cause**: Lines 16–19 subtracted `Number(exp.amount) / n` from the payer's balance when they were not present in `shares`.
- **Fix Details**:
  - Removed lines 16–19 in `src/lib/balances.js` so payers retain 100% credit for amounts paid.
  - Added clean rounding to 2 decimals for all final member balances.
- **Tests Added/Updated**: `tests/balances.test.js` both tests passing.
- **Commit**: `0860bce` - `fix: credit non-participating payers in full and enforce zero-sum balances`
- **Status**: Committed.

---

### Bug 5: Settlement Algorithm Drops Exact Matching Debts
- **Affected Files**:
  - `src/lib/settle.js`
  - `BUGS.md`
- **Issue Description**: When a debtor amount equals a creditor amount, the settlement algorithm increments loop pointers without generating a transfer, leaving debts unresolved.
- **Root Cause**: `if (d.amount > c.amount) ... else if (d.amount < c.amount) ... else { i++; j++; }` skipped pushing transfers on equality.
- **Fix Details**:
  - Refactored `suggestSettlements` to settle `Math.min(d.amount, c.amount)` across all pairs.
  - Generates transfers for exact and partial matches uniformly, advancing debtor/creditor pointers appropriately.
- **Tests Added/Updated**: `tests/settle.test.js` both tests passing.
- **Commit**: `84233b4` - `fix: resolve exact matching debts in suggestSettlements without dropping transfers`
- **Status**: Committed.

---

### Bug 6: Inverted Debtor/Creditor Labels in BalancesPanel
- **Affected Files**:
  - `src/components/BalancesPanel.jsx`
  - `BUGS.md`
- **Issue Description**: Positive balances were displayed as "owes" (red) and negative balances were displayed as "is owed" (green).
- **Root Cause**: The ternary/if logic in `BalancesPanel.jsx` had inverted label strings and CSS class assignments.
- **Fix Details**:
  - Corrected `bal > 0.005` to render `is owed ${formatMoney(bal)}` with `cls = "owed"`.
  - Corrected `bal < -0.005` to render `owes ${formatMoney(-bal)}` with `cls = "owe"`.
- **Tests Added/Updated**: All 17 automated tests passing.
- **Commit**: `2271d82` - `fix: correct inverted debtor and creditor balance labels and styles`
- **Status**: Committed.

---

### Bug 7: "Paid by" Filter Strict Equality Failure
- **Affected Files**:
  - `src/App.jsx`
  - `tests/store.test.js`
  - `BUGS.md`
- **Issue Description**: Filtering by any member in the "Paid by" dropdown displays 0 results.
- **Root Cause**: Strict comparison `e.paidBy !== paidBy` compared number with HTML select string (`1 !== "1"`), failing every expense.
- **Fix Details**:
  - Converted both operands to strings using `String(e.paidBy) !== String(paidBy)` in `src/App.jsx`.
- **Tests Added/Updated**: Added unit test in `tests/store.test.js` verifying string/number compatibility for `paidBy` filtering.
- **Commit**: `5b277ae` - `fix: match paidBy filter using string conversion to resolve type mismatch`
- **Status**: Committed.

---

### Bug 8: Missing members Dependency in SummaryCards perPerson Memo
- **Affected Files**:
  - `src/components/SummaryCards.jsx`
  - `BUGS.md`
- **Issue Description**: When a new member is added, they do not appear in the "Paid so far" card breakdown.
- **Root Cause**: `useMemo` for `perPerson` was only dependent on `[expenses]`, omitting `members`.
- **Fix Details**:
  - Added `members` to the dependency array `[members, expenses]`.
- **Tests Added/Updated**: All 18 automated tests passing.
- **Commit**: `c7067be` - `fix: include members in SummaryCards perPerson useMemo dependency array`
- **Status**: Committed.

---

### Bug 9: Incomplete LocalStorage Hydration on Page Reload
- **Affected Files**:
  - `src/state/store.js`
  - `tests/store.test.js`
  - `BUGS.md`
- **Issue Description**: When page is reloaded, expense dates are loaded as strings rather than Date objects, breaking date methods and causing formatDate to render raw slice strings.
- **Root Cause**: `loadState` returned `JSON.parse(raw)` directly without running `hydrate()`.
- **Fix Details**:
  - Exported `hydrate` from `src/state/store.js`.
  - Updated `loadState` to run `hydrate(parsed)` on cached localStorage data.
- **Tests Added/Updated**: Added unit test in `tests/store.test.js` verifying that serialized string dates are converted to `Date` objects on hydration (19/19 passing).
- **Commit**: `572acdc` - `fix: rehydrate dates into Date instances on localStorage reload`
- **Status**: Committed.

---

### Bug 10: Stale Member State and Form Reset in AddExpenseForm
- **Affected Files**:
  - `src/components/AddExpenseForm.jsx`
  - `BUGS.md`
- **Issue Description**: When new members are added to the trip, they are omitted from default split chips and percentage inputs in AddExpenseForm, and submitted form inputs are not cleared.
- **Root Cause**: `splitWith` and `percents` were only initialized on mount with the initial members list.
- **Fix Details**:
  - Added `useEffect` listening to `members` to incorporate new members into `splitWith` and recalculate `percents`.
  - Added `min="0"` and `max="100"` bounds to percentage inputs.
  - Cleared `description` and `amount` fields on successful form submission.
- **Tests Added/Updated**: All 19 automated tests passing.
- **Commit**: `0306045` - `fix: synchronize AddExpenseForm with dynamic members and reset on submit`
- **Status**: Committed.

---

*(Bug fixes will be logged below one-by-one as we progress)*
