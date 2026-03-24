# সাওম ফার্মেসি

## Current State
App has 6 menu pages: dashboard, medicines, sales, purchases, due, reports. The `Page` type and `navItems` array define navigation in App.tsx.

## Requested Changes (Diff)

### Add
- `"income"` page: আয় (Income) — track daily/monthly income entries with date, amount, description; table view with total
- `"expense"` page: ব্যয় (Expense) — track daily/monthly expense entries with date, amount, description; table view with total
- Both pages use localStorage for offline data persistence
- Both pages have: add new entry form, table of all entries, total sum display, delete option

### Modify
- `Page` type: add `"income"` and `"expense"`
- `navItems`: add আয় (TrendingUp icon) and ব্যয় (TrendingDown icon) entries
- Main content routing: add `{page === "income" && <IncomePage />}` and `{page === "expense" && <ExpensePage />}`

### Remove
- Nothing

## Implementation Plan
1. Update `Page` type to include `"income"` and `"expense"`
2. Add nav items with TrendingUp and TrendingDown icons (already imported)
3. Create `IncomePage` component — form (date, amount, description) + table + total, localStorage key: `incomeRecords`
4. Create `ExpensePage` component — form (date, amount, description) + table + total, localStorage key: `expenseRecords`
5. Wire both pages in main content routing
