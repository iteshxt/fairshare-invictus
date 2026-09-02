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
- **Commit**: `fix: preserve exact split totals without penny loss and validate percentages` (Pending approval)
- **Status**: Ready for commit approval.

---

*(Bug fixes will be logged below one-by-one as we progress)*
