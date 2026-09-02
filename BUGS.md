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

**How to reproduce:** In a group where Member A owes $50 and Member B is owed $50, open the "Settle up" panel. The panel reports "Everyone is settled." despite both members having an active $50 outstanding debt/credit.

**What is wrong:** In `src/lib/settle.js`, the greedy matching loop compared debtor and creditor balances using `if (d.amount > c.amount)` and `else if (d.amount < c.amount)`. When `d.amount === c.amount` (the `else` branch), the code incremented pointers `i += 1; j += 1;` without calling `transfers.push(...)`. Exactly matching debts were completely dropped, leaving members with unresolved balances.

**What I changed:**
- Refactored `suggestSettlements` in `src/lib/settle.js` to transfer `const amount = Math.min(d.amount, c.amount)` and push the transfer whenever `amount > 0.005`.
- Deducted `amount` from both `d.amount` and `c.amount`, advancing `i` when `d.amount <= 0.005` and advancing `j` when `c.amount <= 0.005`.
- Handled all matching and non-matching debts uniformly without dropping transfers, rounding transfer amounts to 2 decimal places.

---

## Bug 6

**How to reproduce:** Open the app and observe the Balances panel. A member with a positive net balance (e.g. Ben who paid for Airbnb and is in credit) is displayed with the red label "owes $181.33". Conversely, members with negative net balances (who consumed more than they paid) are shown with the green label "is owed $X.XX".

**What is wrong:** In `src/components/BalancesPanel.jsx`, the condition for displaying labels and CSS styles was inverted: `bal > 0.005` (a creditor who is owed money by the group) assigned `label = 'owes ...'` with `cls = 'owe'`, while `bal < -0.005` (a debtor who owes the group) assigned `label = 'is owed ...'` with `cls = 'owed'`.

**What I changed:**
- In `src/components/BalancesPanel.jsx`, swapped the labels and CSS classes: positive balances (`bal > 0.005`) now correctly render `is owed ${formatMoney(bal)}` with `cls = "owed"`, and negative balances (`bal < -0.005`) render `owes ${formatMoney(-bal)}` with `cls = "owe"`.

---

## Bug 7

**How to reproduce:** In the Filters panel, select any member from the "Paid by" dropdown (e.g. Aisha Khan or Ben Okonkwo). The expense list becomes completely empty and shows "No expenses match these filters.", even though that member has multiple logged expenses.

**What is wrong:** In `src/components/Filters.jsx`, the HTML `<select>` sets the state value as a DOM string (`"1"`). In `src/App.jsx`, the filter condition used strict inequality: `if (paidBy !== "" && e.paidBy !== paidBy) return false;`. Because `e.paidBy` in the expense records is a number (`1`), `1 !== "1"` always evaluated to `true`, causing all expenses to fail the filter.

**What I changed:**
- In `src/App.jsx`, updated the filter condition to `if (paidBy !== "" && String(e.paidBy) !== String(paidBy)) return false;` to guarantee robust comparison between string and numeric identifiers.

---

## Bug 8

**How to reproduce:** In the Summary card, enter a new member name in the "Add member" form (e.g. "Elena Rostova") and submit. The "Members" count increases from 4 to 5, but Elena is missing from the "Paid so far" breakdown list.

**What is wrong:** In `src/components/SummaryCards.jsx`, the `perPerson` calculation was wrapped in `useMemo` with dependency array `[expenses]`. It omitted `members`. When a new member was added, `expenses` did not change, so `perPerson` was not recomputed and the new member was omitted from the display until an expense was mutated.

**What I changed:**
- In `src/components/SummaryCards.jsx`, updated the `useMemo` dependency array for `perPerson` to `[members, expenses]`.

---

## Bug 9

**How to reproduce:** Load the app and observe expense dates formatted as "12 Mar 2026". Refresh the page in the browser (F5). The dates suddenly switch formatting to raw sliced strings like "2026-03-12".

**What is wrong:** In `src/state/store.js`, `loadState` parsed raw JSON from `localStorage` and returned `JSON.parse(raw)` directly without hydration. Because JSON stringifies dates, after a refresh `expense.date` became a raw string rather than a `Date` object, causing `formatDate` in `src/lib/format.js` to skip `toLocaleDateString` and fall back to `date.slice(0, 10)`.

**What I changed:**
- In `src/state/store.js`, exported `hydrate` and updated `loadState` to pass the parsed `localStorage` JSON through `hydrate(parsed)`. This guarantees `expense.date` is always a proper `Date` instance across initial loads and subsequent browser reloads.

---

## Bug 10

**How to reproduce:** In the Summary card, add a 5th member (e.g. "Elena Rostova"). In the "Add expense" form, Elena's chip appears unselected/inactive by default unlike the other members. Switch to "Custom %" split: Elena does not appear in the percentage grid, and percentage distributions remain fixed to the original 4 members. Furthermore, after submitting an expense, the description and amount inputs are not cleared.

**What is wrong:** In `src/components/AddExpenseForm.jsx`, `splitWith` and `percents` were initialized only once during mount using `useState(members.map(...))`. When new members were added dynamically, the form never synchronized its participant or percentage state, omitting new members from default splits and percentage distributions.

**What I changed:**
- In `src/components/AddExpenseForm.jsx`, added a `useEffect` hook listening to `members` to dynamically incorporate newly added members into `splitWith` and recalculate `percents` via `evenPercents()`.
- Guaranteed that `paidBy` points to a valid member ID when members change.
- Added `min="0"` and `max="100"` attributes to the percentage number inputs.
- Automatically cleared `description` and `amount` form fields upon successful expense submission.

---

## Bug 11

**How to reproduce:** In an expense row's edit amount input, enter an invalid string like "abc" or a negative amount "-10" and click anywhere outside. The input displays "abc" or "-10" instead of reverting to the actual stored expense amount. Additionally, pressing Enter does not trigger saving.

**What is wrong:** In `src/components/ExpenseList.jsx`, `onBlur` checked `if (Number.isFinite(n) && n > 0 && n !== Number(expense.amount)) onSaveAmount(n);` but did not have an `else` branch to restore the `draft` state when invalid input was supplied. This resulted in an unpersisted visual desync between the input value and application state. Furthermore, keyboard listeners (`Enter` / `Escape`) were absent.

**What I changed:**
- In `src/components/ExpenseList.jsx`, added an `else` clause in `onBlur` that resets `draft` to `String(expense.amount)`.
- Added `onKeyDown` to commit on `Enter` via `blur()` and cancel/reset on `Escape`.

---

## Bug 12

**How to reproduce:** In the "Add expense" form, clear the date input field completely (empty string) and submit the expense. The expense is added with `date: Invalid Date`. The sorting comparator `dateValue(b.date) - dateValue(a.date)` returns `NaN`, breaking array sorting, and the UI displays `"Invalid Date"`.

**What is wrong:** In `src/components/AddExpenseForm.jsx`, `submit` unconditionally instantiated `date: new Date(date)` without checking if the date input was cleared or invalid.

**What I changed:**
- In `src/components/AddExpenseForm.jsx`, added a date validation step in `submit`: `const parsedDate = date ? new Date(date) : new Date();`. If `Number.isNaN(parsedDate.getTime())`, the form halts and sets an error message `"Please select a valid date."`.

---

## Bug 13

**How to reproduce:** Add a member whose name begins with a leading space (e.g. `" Elena"`). Observe the member's avatar icon in the Balances panel or Expense list. The avatar displays `"UN"` instead of `"E"`.

**What is wrong:** `initials(name)` used `name.split(" ")` without trimming. For names with leading whitespace, `split(" ")` resulted in an empty first token `""`. Taking `""[0]` yielded `undefined`, which string-concatenated to `"undefinedE"` and sliced to `"UN"`.

**What I changed:**
- In `src/components/ExpenseList.jsx` and `src/components/BalancesPanel.jsx`, updated `initials()` to trim the name, split on arbitrary whitespace (`/\s+/`), filter out falsy tokens, and safely extract the first initials.

---

## Bug 14

**How to reproduce:** In `AddExpenseForm`, select "Custom %", customize split percentages, then toggle one member off and submit. The unselected member's percentage was still attached in the `percents` object. Additionally, floating point addition in `totalSpent` produced unrounded IEEE 754 precision artifacts (e.g. `0.1 + 0.2 = 0.30000000000000004`).

**What is wrong:** In `AddExpenseForm.jsx`, `percents` state preserved keys for deselected members rather than pruning them to active `splitWith` participants. In `src/lib/balances.js`, `totalSpent` did not round the sum to 2 decimal places. In `SummaryCards.jsx`, `filter` on `paidBy` used strict equality rather than string conversion.

**What I changed:**
- In `src/components/AddExpenseForm.jsx`, sanitized `activePercents` in `submit` to only retain keys present in `splitWith`.
- In `src/lib/balances.js`, added `Math.round(sum * 100) / 100` to `totalSpent()`.
- In `src/components/SummaryCards.jsx`, used `String(e.paidBy) === String(m.id)` and rounded individual paid sums to cents.

---
