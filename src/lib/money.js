export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function splitEqual(amount, ids) {
  if (!ids || ids.length === 0) return {};
  const totalCents = Math.round(Number(amount) * 100);
  const n = ids.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents % n;
  const shares = {};
  ids.forEach((id, i) => {
    const cents = base + (i < remainder ? 1 : 0);
    shares[id] = cents / 100;
  });
  return shares;
}

export function percentsSumTo100(percents) {
  const values = Object.values(percents).map(Number);
  if (values.length === 0) return false;
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 100)) return false;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01;
}

export function splitByPercent(amount, percents) {
  const entries = Object.entries(percents);
  if (entries.length === 0) return {};
  const totalCents = Math.round(Number(amount) * 100);
  const shares = {};
  let allocatedCents = 0;

  entries.forEach(([id, pct], i) => {
    if (i === entries.length - 1) {
      shares[id] = (totalCents - allocatedCents) / 100;
    } else {
      const cents = Math.round((totalCents * Number(pct)) / 100);
      shares[id] = cents / 100;
      allocatedCents += cents;
    }
  });
  return shares;
}

export function sharesForExpense(expense) {
  if (expense.splitType === "percent" && expense.percents) {
    return splitByPercent(expense.amount, expense.percents);
  }
  return splitEqual(expense.amount, expense.splitWith);
}
